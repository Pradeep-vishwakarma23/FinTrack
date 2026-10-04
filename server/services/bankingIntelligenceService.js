/**
 * FinTrack Phase 6.1: Banking Intelligence & Financial Insights Engine
 * Pure analytical and forecasting algorithms operating strictly on confirmed ledger transactions.
 */

/**
 * Sanitizes numeric amounts to ensure non-negative valid values.
 */
export const sanitizeAmount = (val) => {
  const num = Number(val);
  return isNaN(num) || num < 0 ? 0 : num;
};

/**
 * Pure filter ensuring only confirmed ledger transactions enter intelligence algorithms.
 * Staged and ignored transactions are strictly excluded.
 */
export const filterConfirmedTransactions = (transactions = []) => {
  if (!Array.isArray(transactions)) return [];
  return transactions.filter(
    (t) => t && t.status === 'confirmed' && sanitizeAmount(t.amount) >= 0
  );
};

/**
 * Calculates core financial metrics: income, expenses, net savings, savings rate, and deficit status.
 */
export const calculateFinancialMetrics = (transactions = [], budget = null) => {
  const confirmed = filterConfirmedTransactions(transactions);

  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of confirmed) {
    const amt = sanitizeAmount(t.amount);
    if (t.type === 'income') {
      totalIncome += amt;
    } else if (t.type === 'expense') {
      totalExpense += amt;
    }
  }

  totalIncome = Number(totalIncome.toFixed(2));
  totalExpense = Number(totalExpense.toFixed(2));

  const netSavings = Number((totalIncome - totalExpense).toFixed(2));
  const isDeficit = netSavings < 0;

  // Savings rate calculation with safe division guard
  let savingsRate = 0;
  if (totalIncome > 0) {
    const rawRate = (netSavings / totalIncome) * 100;
    savingsRate = Number(rawRate.toFixed(2));
  }

  const monthlyBudget = sanitizeAmount(budget?.monthlyBudget);
  const budgetRemaining = monthlyBudget > 0 ? Number((monthlyBudget - totalExpense).toFixed(2)) : netSavings;

  return {
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    isDeficit,
    monthlyBudget,
    budgetRemaining,
    transactionCount: confirmed.length,
    incomeCount: confirmed.filter((t) => t.type === 'income').length,
    expenseCount: confirmed.filter((t) => t.type === 'expense').length
  };
};

/**
 * Computes category-level spending, percentage share, average ticket size, and budget utilization.
 */
export const calculateCategorySpending = (transactions = [], budget = null) => {
  const confirmed = filterConfirmedTransactions(transactions);
  const expenses = confirmed.filter((t) => t.type === 'expense');

  const totalExpense = expenses.reduce((acc, t) => acc + sanitizeAmount(t.amount), 0);
  const categoryMap = new Map();

  for (const t of expenses) {
    const category = (t.category || 'Other').trim();
    const amt = sanitizeAmount(t.amount);

    if (!categoryMap.has(category)) {
      categoryMap.set(category, { amount: 0, count: 0 });
    }
    const current = categoryMap.get(category);
    current.amount += amt;
    current.count += 1;
  }

  const categoryBudgetsMap = new Map();
  if (budget?.categoryBudgets && Array.isArray(budget.categoryBudgets)) {
    for (const cb of budget.categoryBudgets) {
      if (cb && cb.category) {
        categoryBudgetsMap.set(cb.category.trim().toLowerCase(), sanitizeAmount(cb.limit));
      }
    }
  }

  const results = [];
  for (const [category, data] of categoryMap.entries()) {
    const amount = Number(data.amount.toFixed(2));
    const percentage = totalExpense > 0 ? Number(((amount / totalExpense) * 100).toFixed(2)) : 0;
    const averageTicket = data.count > 0 ? Number((amount / data.count).toFixed(2)) : 0;

    const budgetLimit = categoryBudgetsMap.get(category.toLowerCase()) ?? null;
    let budgetUtilization = null;
    let isOverBudget = false;

    if (budgetLimit !== null && budgetLimit > 0) {
      budgetUtilization = Number(((amount / budgetLimit) * 100).toFixed(2));
      isOverBudget = amount > budgetLimit;
    } else if (budgetLimit === 0) {
      budgetUtilization = amount > 0 ? 100 : 0;
      isOverBudget = amount > 0;
    }

    results.push({
      category,
      amount,
      percentage,
      count: data.count,
      averageTicket,
      budgetLimit,
      budgetUtilization,
      isOverBudget
    });
  }

  return results.sort((a, b) => b.amount - a.amount);
};

/**
 * Computes merchant analytics: top merchants by spend, transaction counts, and average ticket size.
 */
export const calculateMerchantAnalytics = (transactions = [], { limit = 10 } = {}) => {
  const confirmed = filterConfirmedTransactions(transactions);
  const expenses = confirmed.filter((t) => t.type === 'expense');

  const totalExpense = expenses.reduce((acc, t) => acc + sanitizeAmount(t.amount), 0);
  const merchantMap = new Map();

  for (const t of expenses) {
    const merchant = (t.merchant || t.title || 'Unknown Merchant').trim();
    const amt = sanitizeAmount(t.amount);

    if (!merchantMap.has(merchant)) {
      merchantMap.set(merchant, { totalSpend: 0, count: 0, lastDate: t.transactionDate });
    }
    const current = merchantMap.get(merchant);
    current.totalSpend += amt;
    current.count += 1;
    if (t.transactionDate && (!current.lastDate || new Date(t.transactionDate) > new Date(current.lastDate))) {
      current.lastDate = t.transactionDate;
    }
  }

  const results = [];
  for (const [merchant, data] of merchantMap.entries()) {
    const totalSpend = Number(data.totalSpend.toFixed(2));
    const percentage = totalExpense > 0 ? Number(((totalSpend / totalExpense) * 100).toFixed(2)) : 0;
    const averageTicket = data.count > 0 ? Number((totalSpend / data.count).toFixed(2)) : 0;

    results.push({
      merchant,
      totalSpend,
      count: data.count,
      averageTicket,
      percentage,
      lastTransactionDate: data.lastDate
    });
  }

  results.sort((a, b) => b.totalSpend - a.totalSpend);
  const maxLimit = Math.max(1, parseInt(limit, 10) || 10);
  return results.slice(0, maxLimit);
};

/**
 * Statistical helpers for anomaly detection.
 */
const calculateStats = (numbers = []) => {
  if (numbers.length === 0) return { mean: 0, stdDev: 0, median: 0 };
  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / sorted.length;

  const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / sorted.length;
  const stdDev = Math.sqrt(variance);

  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  return { mean, stdDev, median };
};

/**
 * Identifies anomaly candidate transactions based on statistical deviation, budget shock, or baseline spikes.
 */
export const detectAnomalies = (transactions = [], budget = null, historicalTransactions = []) => {
  const confirmed = filterConfirmedTransactions(transactions);
  const expenses = confirmed.filter((t) => t.type === 'expense');

  if (expenses.length === 0) return [];

  const monthlyBudget = sanitizeAmount(budget?.monthlyBudget);

  // Group current expenses by category
  const categoryExpensesMap = new Map();
  for (const t of expenses) {
    const cat = (t.category || 'Other').trim();
    if (!categoryExpensesMap.has(cat)) {
      categoryExpensesMap.set(cat, []);
    }
    categoryExpensesMap.get(cat).push(sanitizeAmount(t.amount));
  }

  // Pre-calculate historical category averages if available
  const historicalConfirmed = filterConfirmedTransactions(historicalTransactions);
  const historicalCategorySpendMap = new Map();
  if (historicalConfirmed.length > 0) {
    for (const t of historicalConfirmed) {
      if (t.type === 'expense') {
        const cat = (t.category || 'Other').trim();
        historicalCategorySpendMap.set(cat, (historicalCategorySpendMap.get(cat) || 0) + sanitizeAmount(t.amount));
      }
    }
  }

  const anomalies = [];
  const seenTxIds = new Set();

  for (const t of expenses) {
    const amt = sanitizeAmount(t.amount);
    const cat = (t.category || 'Other').trim();
    const catAmounts = categoryExpensesMap.get(cat) || [];
    const stats = calculateStats(catAmounts);

    let isAnomaly = false;
    let anomalyType = '';
    let severity = 'LOW';
    let reason = '';
    let baselineValue = 0;

    // Rule 1: Single Transaction Budget Shock (>= 40% of monthly budget)
    if (monthlyBudget > 0 && amt >= monthlyBudget * 0.40) {
      isAnomaly = true;
      anomalyType = 'BUDGET_SHOCK';
      severity = amt >= monthlyBudget * 0.70 ? 'HIGH' : 'MEDIUM';
      reason = `Transaction represents ${((amt / monthlyBudget) * 100).toFixed(1)}% of your entire monthly budget.`;
      baselineValue = monthlyBudget;
    }
    // Rule 2: Category Statistical Outlier (Z-score >= 1.75 or >= 2.5x median with min amount > 500)
    else if (catAmounts.length >= 2) {
      const zScore = stats.stdDev > 0 ? (amt - stats.mean) / stats.stdDev : 0;
      const isMedianOutlier = stats.median > 0 && amt >= stats.median * 2.5 && amt > 500;
      const isZScoreOutlier = zScore >= 1.75 && amt > 500;

      if (isZScoreOutlier || isMedianOutlier) {
        isAnomaly = true;
        anomalyType = 'CATEGORY_OUTLIER';
        severity = zScore >= 2.5 || amt >= (stats.median || stats.mean) * 4 ? 'HIGH' : 'MEDIUM';
        reason = `Expense of ₹${amt.toLocaleString('en-IN')} is unusually high compared to your typical ${cat} spend (median ₹${Math.round(stats.median).toLocaleString('en-IN')}).`;
        baselineValue = Number(stats.median.toFixed(2));
      }
    }

    if (isAnomaly) {
      const txId = t._id ? String(t._id) : `${t.merchant}_${t.transactionDate}_${amt}`;
      if (!seenTxIds.has(txId)) {
        seenTxIds.add(txId);
        anomalies.push({
          transactionId: t._id || null,
          title: t.title || t.merchant || 'Expense',
          merchant: t.merchant || t.title || 'Unknown Merchant',
          category: cat,
          amount: amt,
          transactionDate: t.transactionDate,
          anomalyType,
          severity,
          reason,
          baselineValue
        });
      }
    }
  }

  // Sort by severity (HIGH > MEDIUM > LOW) then by amount descending
  const severityRank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  return anomalies.sort((a, b) => {
    const diff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
    return diff !== 0 ? diff : b.amount - a.amount;
  });
};

/**
 * Calculates forecasting confidence score based on transaction volume, history depth, and days elapsed.
 */
const computeForecastConfidence = ({ txCount = 0, daysElapsed = 1, totalDays = 30, histMonthsCount = 0 }) => {
  if (txCount === 0) return 0;

  let score = 30; // base score for having transactions

  // Days elapsed weight (up to 35 points)
  const daysFactor = Math.min((daysElapsed / totalDays) * 35, 35);
  score += daysFactor;

  // Transaction count weight (up to 20 points)
  const txFactor = Math.min(txCount * 2, 20);
  score += txFactor;

  // Historical depth weight (up to 15 points)
  const histFactor = Math.min(histMonthsCount * 5, 15);
  score += histFactor;

  // Clamp between 50% and 95%
  return Math.min(Math.max(Math.round(score), 50), 95);
};

/**
 * Forecasts monthly expense run-rate and evaluates budget velocity / risk levels.
 */
export const calculateForecastAndRisk = ({
  currentTransactions = [],
  historicalTransactions = [],
  budget = null,
  referenceDate = new Date()
}) => {
  const confirmedCurrent = filterConfirmedTransactions(currentTransactions);
  const currentExpenses = confirmedCurrent.filter((t) => t.type === 'expense');

  const refDate = referenceDate instanceof Date && !isNaN(referenceDate.getTime()) ? referenceDate : new Date();
  const year = refDate.getFullYear();
  const month = refDate.getMonth();

  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const rawDay = refDate.getDate();
  const daysElapsed = Math.max(1, Math.min(rawDay, totalDaysInMonth));
  const daysRemaining = Math.max(0, totalDaysInMonth - daysElapsed);

  const currentMonthExpense = Number(
    currentExpenses.reduce((acc, t) => acc + sanitizeAmount(t.amount), 0).toFixed(2)
  );

  // Daily burn rate calculation
  const dailyBurnRate = Number((currentMonthExpense / daysElapsed).toFixed(2));
  const runRateProjection = Number((dailyBurnRate * totalDaysInMonth).toFixed(2));

  // Historical monthly expense grouping
  const confirmedHist = filterConfirmedTransactions(historicalTransactions);
  const histMonthMap = new Map();

  for (const t of confirmedHist) {
    if (t.type === 'expense') {
      const d = new Date(t.transactionDate || Date.now());
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        histMonthMap.set(key, (histMonthMap.get(key) || 0) + sanitizeAmount(t.amount));
      }
    }
  }

  const histMonths = Array.from(histMonthMap.values()).filter((v) => v > 0);
  let historicalAverageExpense = 0;
  if (histMonths.length > 0) {
    const sum = histMonths.reduce((a, b) => a + b, 0);
    historicalAverageExpense = Number((sum / histMonths.length).toFixed(2));
  }

  // Blended forecast calculation
  let projectedExpense = 0;
  let forecastMethod = 'Linear run-rate projection';

  if (currentMonthExpense === 0 && historicalAverageExpense === 0) {
    projectedExpense = 0;
    forecastMethod = 'No expense data recorded';
  } else if (historicalAverageExpense > 0 && daysElapsed < totalDaysInMonth) {
    // Blend 70% current run-rate + 30% historical average
    projectedExpense = Number(((0.70 * runRateProjection) + (0.30 * historicalAverageExpense)).toFixed(2));
    forecastMethod = 'Blended MTD run-rate (70%) and historical moving average (30%)';
  } else {
    projectedExpense = runRateProjection;
    forecastMethod = 'Linear month-to-date run-rate projection';
  }

  const confidence = computeForecastConfidence({
    txCount: currentExpenses.length,
    daysElapsed,
    totalDays: totalDaysInMonth,
    histMonthsCount: histMonths.length
  });

  // Budget Velocity & Risk classification
  const monthlyBudget = sanitizeAmount(budget?.monthlyBudget);
  let budgetVelocity = null;
  let riskLevel = 'SAFE'; // 'SAFE' | 'ELEVATED' | 'CRITICAL'
  let currentUtilization = 0;
  let projectedUtilization = 0;
  let projectedVariance = 0;
  let statusMessage = 'No monthly budget target configured.';

  if (monthlyBudget > 0) {
    budgetVelocity = Number((projectedExpense / monthlyBudget).toFixed(2));
    currentUtilization = Number(((currentMonthExpense / monthlyBudget) * 100).toFixed(2));
    projectedUtilization = Number(((projectedExpense / monthlyBudget) * 100).toFixed(2));
    projectedVariance = Number((projectedExpense - monthlyBudget).toFixed(2));

    if (currentMonthExpense > monthlyBudget || budgetVelocity > 1.0) {
      riskLevel = 'CRITICAL';
      statusMessage = currentMonthExpense > monthlyBudget
        ? `Budget already exceeded by ₹${(currentMonthExpense - monthlyBudget).toLocaleString('en-IN')}.`
        : `At current burn velocity (${dailyBurnRate}/day), spending is projected to exceed budget by ₹${projectedVariance.toLocaleString('en-IN')}.`;
    } else if (budgetVelocity >= 0.85) {
      riskLevel = 'ELEVATED';
      statusMessage = `Spending is on pace to utilize ${projectedUtilization}% of monthly budget.`;
    } else {
      riskLevel = 'SAFE';
      statusMessage = `Spending velocity is healthy. Projected surplus is ₹${(monthlyBudget - projectedExpense).toLocaleString('en-IN')}.`;
    }
  }

  return {
    currentMonthExpense,
    daysElapsed,
    totalDaysInMonth,
    daysRemaining,
    dailyBurnRate,
    runRateProjection,
    historicalAverageExpense,
    projectedExpense,
    forecastMethod,
    confidence,
    monthlyBudget,
    budgetVelocity,
    riskLevel,
    riskDetails: {
      status: riskLevel,
      currentUtilization,
      projectedUtilization,
      projectedVariance,
      message: statusMessage
    }
  };
};

/**
 * Assembles a complete banking intelligence summary snapshot.
 */
export const calculateBankingIntelligenceSummary = ({
  currentTransactions = [],
  historicalTransactions = [],
  budget = null,
  referenceDate = new Date()
}) => {
  const metrics = calculateFinancialMetrics(currentTransactions, budget);
  const categorySpending = calculateCategorySpending(currentTransactions, budget);
  const topMerchants = calculateMerchantAnalytics(currentTransactions, { limit: 5 });
  const anomalies = detectAnomalies(currentTransactions, budget, historicalTransactions);
  const forecast = calculateForecastAndRisk({
    currentTransactions,
    historicalTransactions,
    budget,
    referenceDate
  });

  return {
    metrics,
    categorySpending,
    topMerchants,
    anomalies: anomalies.slice(0, 5),
    totalAnomaliesCount: anomalies.length,
    forecast
  };
};
