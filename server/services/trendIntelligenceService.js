import Transaction from '../models/Transaction.js';

/**
 * FinTrack Phase 7.4: Multi-Month Financial Trends & Comparative Intelligence Engine
 * Pure deterministic multi-month calculations operating strictly on confirmed ledger transactions.
 * Read-only with zero database mutation.
 */

/**
 * Parses and generates an ordered array of month strings ('YYYY-MM') for the given range.
 */
export const generateMonthSeries = (referenceMonthStr = null, rangeMonths = 6) => {
  const count = rangeMonths === 12 ? 12 : 6;
  const now = new Date();

  let refYear = now.getFullYear();
  let refMonth = now.getMonth(); // 0-indexed

  if (referenceMonthStr && typeof referenceMonthStr === 'string') {
    const parts = referenceMonthStr.trim().split('-');
    if (parts.length === 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
        refYear = y;
        refMonth = m;
      }
    }
  }

  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(refYear, refMonth - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    months.push(`${y}-${m}`);
  }

  return months;
};

/**
 * Returns the start and end Date objects bounding a month list.
 */
export const getSeriesDateBounds = (monthList) => {
  if (!monthList || monthList.length === 0) {
    const now = new Date();
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    };
  }

  const firstMonth = monthList[0].split('-');
  const lastMonth = monthList[monthList.length - 1].split('-');

  const startYear = parseInt(firstMonth[0], 10);
  const startM = parseInt(firstMonth[1], 10) - 1;

  const endYear = parseInt(lastMonth[0], 10);
  const endM = parseInt(lastMonth[1], 10) - 1;

  const startDate = new Date(startYear, startM, 1, 0, 0, 0, 0);
  const endDate = new Date(endYear, endM + 1, 0, 23, 59, 59, 999);

  return { startDate, endDate };
};

/**
 * Helper to safely compute percentage change without NaN / Infinity.
 */
export const calculateSafePercentageChange = (current, previous) => {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;

  if (p === 0) {
    return c > 0 ? 100 : 0;
  }

  const diff = c - p;
  const pct = (diff / Math.abs(p)) * 100;
  return Math.round(pct * 100) / 100;
};

/**
 * Calculates month-over-month comparisons between two monthly records.
 */
export const calculateMoMComparison = (currentMonthData, previousMonthData) => {
  const cur = currentMonthData || { month: '', income: 0, expenses: 0, netSavings: 0 };
  const prev = previousMonthData || { month: '', income: 0, expenses: 0, netSavings: 0 };

  const incomeChange = Math.round((cur.income - prev.income) * 100) / 100;
  const incomePct = calculateSafePercentageChange(cur.income, prev.income);

  const expensesChange = Math.round((cur.expenses - prev.expenses) * 100) / 100;
  const expensesPct = calculateSafePercentageChange(cur.expenses, prev.expenses);

  const savingsChange = Math.round((cur.netSavings - prev.netSavings) * 100) / 100;
  const savingsPct = calculateSafePercentageChange(cur.netSavings, prev.netSavings);

  return {
    currentMonth: cur.month,
    previousMonth: prev.month,
    income: {
      current: cur.income,
      previous: prev.income,
      change: incomeChange,
      percentageChange: incomePct
    },
    expenses: {
      current: cur.expenses,
      previous: prev.expenses,
      change: expensesChange,
      percentageChange: expensesPct
    },
    savings: {
      current: cur.netSavings,
      previous: prev.netSavings,
      change: savingsChange,
      percentageChange: savingsPct
    }
  };
};

/**
 * Evaluates deterministic savings momentum across the monthly series.
 */
export const calculateSavingsMomentum = (monthlySnapshots = []) => {
  if (!monthlySnapshots || monthlySnapshots.length < 2) {
    return {
      state: 'INSUFFICIENT_DATA',
      score: 0,
      savingsRateDelta: 0,
      netSavingsDelta: 0,
      activeMonthsCount: 0
    };
  }

  const activeMonths = monthlySnapshots.filter((m) => m.transactionCount > 0 || m.income > 0 || m.expenses > 0);
  if (activeMonths.length < 2) {
    return {
      state: 'INSUFFICIENT_DATA',
      score: 0,
      savingsRateDelta: 0,
      netSavingsDelta: 0,
      activeMonthsCount: activeMonths.length
    };
  }

  const current = monthlySnapshots[monthlySnapshots.length - 1];
  const previous = monthlySnapshots[monthlySnapshots.length - 2];

  const netSavingsDelta = Math.round((current.netSavings - previous.netSavings) * 100) / 100;
  const savingsRateDelta = Math.round((current.savingsRate - previous.savingsRate) * 100) / 100;

  // Multi-month trend weight: check recent 3 months if available
  let trendScore = 0;
  if (savingsRateDelta >= 3 || (netSavingsDelta >= 500 && current.netSavings >= 0)) {
    trendScore += 1;
  } else if (savingsRateDelta <= -3 || (netSavingsDelta <= -500 && previous.netSavings > current.netSavings)) {
    trendScore -= 1;
  }

  if (monthlySnapshots.length >= 3) {
    const prev2 = monthlySnapshots[monthlySnapshots.length - 3];
    const prevDelta = previous.netSavings - prev2.netSavings;
    if (prevDelta > 0 && netSavingsDelta >= 0) trendScore += 0.5;
    if (prevDelta < 0 && netSavingsDelta <= 0) trendScore -= 0.5;
  }

  let state = 'STABLE';
  if (trendScore >= 1) {
    state = 'IMPROVING';
  } else if (trendScore <= -1) {
    state = 'DECLINING';
  }

  return {
    state,
    score: trendScore,
    savingsRateDelta,
    netSavingsDelta,
    activeMonthsCount: activeMonths.length
  };
};

/**
 * Analyzes category-level spending trends and variances across the series.
 */
export const calculateCategoryTrends = (transactions = [], monthList = []) => {
  const confirmedExpenses = transactions.filter((t) => t.status === 'confirmed' && t.type === 'expense');

  // Map category to monthly sums
  const categoryMonthlyMap = new Map();

  for (const t of confirmedExpenses) {
    const cat = (t.category || 'Other').trim();
    const d = new Date(t.transactionDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!categoryMonthlyMap.has(cat)) {
      categoryMonthlyMap.set(cat, new Map());
    }
    const catMap = categoryMonthlyMap.get(cat);
    const curAmt = catMap.get(monthKey) || 0;
    catMap.set(monthKey, Math.round((curAmt + (Number(t.amount) || 0)) * 100) / 100);
  }

  const count = monthList.length || 1;
  const latestMonth = monthList[monthList.length - 1];
  const previousMonth = monthList.length > 1 ? monthList[monthList.length - 2] : null;

  const categoryResults = [];

  for (const [category, monthlyMap] of categoryMonthlyMap.entries()) {
    let totalSpending = 0;
    const monthlyValues = [];

    for (const m of monthList) {
      const amt = monthlyMap.get(m) || 0;
      totalSpending += amt;
      monthlyValues.push({ month: m, amount: amt });
    }

    totalSpending = Math.round(totalSpending * 100) / 100;
    const averageMonthlySpending = Math.round((totalSpending / count) * 100) / 100;

    const latestMonthSpending = monthlyMap.get(latestMonth) || 0;
    const previousMonthSpending = previousMonth ? (monthlyMap.get(previousMonth) || 0) : latestMonthSpending;
    const change = Math.round((latestMonthSpending - previousMonthSpending) * 100) / 100;
    const percentageChange = calculateSafePercentageChange(latestMonthSpending, previousMonthSpending);

    let trend = 'stable';
    if (previousMonthSpending === 0 && latestMonthSpending > 0) {
      trend = 'new';
    } else if (previousMonthSpending === 0 && latestMonthSpending === 0) {
      trend = 'inactive';
    } else if (change >= 50 && percentageChange >= 5) {
      trend = 'increasing';
    } else if (change <= -50 && percentageChange <= -5) {
      trend = 'decreasing';
    }

    categoryResults.push({
      category,
      totalSpending,
      averageMonthlySpending,
      latestMonthSpending,
      previousMonthSpending,
      change,
      percentageChange,
      trend,
      monthlyValues
    });
  }

  // Sort by total spending descending
  categoryResults.sort((a, b) => b.totalSpending - a.totalSpending);

  return categoryResults;
};

/**
 * Computes historical extremes (highest/lowest expense, highest income, highest savings).
 */
export const calculateExtremes = (monthlySnapshots = []) => {
  const activeMonths = monthlySnapshots.filter((m) => m.transactionCount > 0 || m.income > 0 || m.expenses > 0);

  if (activeMonths.length === 0) {
    return {
      highestExpenseMonth: null,
      lowestExpenseMonth: null,
      highestIncomeMonth: null,
      highestSavingsMonth: null
    };
  }

  let highestExpense = null;
  let lowestExpense = null;
  let highestIncome = null;
  let highestSavings = null;

  for (const m of activeMonths) {
    if (m.expenses > 0) {
      if (!highestExpense || m.expenses > highestExpense.amount) {
        highestExpense = { month: m.month, amount: m.expenses };
      }
      if (!lowestExpense || m.expenses < lowestExpense.amount) {
        lowestExpense = { month: m.month, amount: m.expenses };
      }
    }

    if (m.income > 0) {
      if (!highestIncome || m.income > highestIncome.amount) {
        highestIncome = { month: m.month, amount: m.income };
      }
    }

    if (m.income > 0 || m.expenses > 0) {
      if (!highestSavings || m.netSavings > highestSavings.amount) {
        highestSavings = { month: m.month, amount: m.netSavings };
      }
    }
  }

  return {
    highestExpenseMonth: highestExpense,
    lowestExpenseMonth: lowestExpense,
    highestIncomeMonth: highestIncome,
    highestSavingsMonth: highestSavings
  };
};

/**
 * Pure deterministic Multi-Month Financial Trends Intelligence Engine.
 * Scoped strictly to confirmed transactions for req.userId.
 */
export const calculateMultiMonthTrends = async ({
  userId,
  range = '6m',
  referenceMonth = null,
  transactions: injectedTransactions = null
}) => {
  if (!userId) {
    const error = new Error('User ID is required for trend calculations.');
    error.statusCode = 400;
    throw error;
  }

  const rangeMonths = range === '12m' ? 12 : 6;
  const monthList = generateMonthSeries(referenceMonth, rangeMonths);
  const { startDate, endDate } = getSeriesDateBounds(monthList);

  let transactions;
  if (injectedTransactions) {
    transactions = injectedTransactions.filter(
      (t) => t.status === 'confirmed' && String(t.userId) === String(userId)
    );
  } else {
    transactions = await Transaction.find({
      userId,
      status: 'confirmed',
      transactionDate: { $gte: startDate, $lte: endDate }
    }).sort({ transactionDate: 1 });
  }

  // 1. Group transactions into monthly buckets
  const monthBuckets = new Map();
  for (const m of monthList) {
    monthBuckets.set(m, {
      month: m,
      income: 0,
      expenses: 0,
      netSavings: 0,
      savingsRate: 0,
      transactionCount: 0
    });
  }

  for (const t of transactions) {
    if (t.type !== 'income' && t.type !== 'expense') {
      continue; // Exclude transfers and unknown types
    }

    const d = new Date(t.transactionDate || t.date);
    if (isNaN(d.getTime())) continue;
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (monthBuckets.has(monthKey)) {
      const bucket = monthBuckets.get(monthKey);
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        bucket.income += amt;
      } else if (t.type === 'expense') {
        bucket.expenses += amt;
      }
      bucket.transactionCount += 1;
    }
  }

  // 2. Finalize monthly metrics
  const monthlySnapshots = [];
  for (const m of monthList) {
    const b = monthBuckets.get(m);
    const income = Math.round(b.income * 100) / 100;
    const expenses = Math.round(b.expenses * 100) / 100;
    const netSavings = Math.round((income - expenses) * 100) / 100;
    let savingsRate = 0;
    if (income > 0) {
      savingsRate = Math.round(((netSavings / income) * 100) * 100) / 100;
    }

    monthlySnapshots.push({
      month: m,
      income,
      expenses,
      netSavings,
      savingsRate,
      transactionCount: b.transactionCount
    });
  }

  // 3. Month-over-Month comparison (latest vs previous)
  const currentSnapshot = monthlySnapshots[monthlySnapshots.length - 1];
  const previousSnapshot = monthlySnapshots.length > 1 ? monthlySnapshots[monthlySnapshots.length - 2] : null;
  const comparison = calculateMoMComparison(currentSnapshot, previousSnapshot);

  // 4. Savings Momentum
  const momentum = calculateSavingsMomentum(monthlySnapshots);

  // 5. Category Trends
  const categories = calculateCategoryTrends(transactions, monthList);

  // 6. Extremes
  const extremes = calculateExtremes(monthlySnapshots);

  // 7. Structured Facts Summary
  const growingCat = categories.find((c) => c.trend === 'increasing');
  const decliningCat = categories.find((c) => c.trend === 'decreasing');

  let expenseTrend = 'stable';
  if (comparison.expenses.change >= 50 && comparison.expenses.percentageChange >= 5) {
    expenseTrend = 'increasing';
  } else if (comparison.expenses.change <= -50 && comparison.expenses.percentageChange <= -5) {
    expenseTrend = 'decreasing';
  }

  let incomeTrend = 'stable';
  if (comparison.income.change >= 50 && comparison.income.percentageChange >= 5) {
    incomeTrend = 'increasing';
  } else if (comparison.income.change <= -50 && comparison.income.percentageChange <= -5) {
    incomeTrend = 'decreasing';
  }

  let savingsTrend = 'stable';
  if (comparison.savings.change >= 50 && comparison.savings.percentageChange >= 5) {
    savingsTrend = 'improving';
  } else if (comparison.savings.change <= -50 && comparison.savings.percentageChange <= -5) {
    savingsTrend = 'declining';
  }

  const summary = {
    expenseTrend,
    incomeTrend,
    savingsTrend,
    savingsMomentum: momentum.state,
    topGrowingCategory: growingCat ? growingCat.category : null,
    topDecliningCategory: decliningCat ? decliningCat.category : null,
    highestExpenseMonth: extremes.highestExpenseMonth,
    highestIncomeMonth: extremes.highestIncomeMonth,
    highestSavingsMonth: extremes.highestSavingsMonth
  };

  return {
    success: true,
    range: range === '12m' ? '12m' : '6m',
    period: `${monthList[0]} to ${monthList[monthList.length - 1]}`,
    months: monthlySnapshots,
    comparison,
    categories,
    momentum,
    extremes,
    summary
  };
};

export default {
  calculateMultiMonthTrends,
  generateMonthSeries,
  getSeriesDateBounds,
  calculateSafePercentageChange,
  calculateMoMComparison,
  calculateSavingsMomentum,
  calculateCategoryTrends,
  calculateExtremes
};
