export const currency = (value = 0) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const getMonthRange = (dateInput = new Date()) => {
  const d = new Date(dateInput);
  const year = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
  const month = isNaN(d.getMonth()) ? new Date().getMonth() : d.getMonth();

  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return { start, end };
};

export const summarizeTransactions = (transactions = [], budget = null) => {
  const list = Array.isArray(transactions) ? transactions : [];

  const incomeList = list.filter((t) => t.type === 'income');
  const expenseList = list.filter((t) => t.type === 'expense');

  const totalIncome = incomeList.reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalExpense = expenseList.reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const savings = totalIncome - totalExpense;

  const monthlyBudget = Number(budget?.monthlyBudget || 0);
  const budgetRemaining = monthlyBudget > 0 ? monthlyBudget - totalExpense : savings;

  // Category breakdown for expenses
  const categoryMap = {};
  for (const t of expenseList) {
    const cat = t.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(t.amount || 0);
  }

  const categoryBreakdown = Object.keys(categoryMap)
    .map((category) => {
      const amount = categoryMap[category];
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        category,
        amount,
        percentage: Number(percentage.toFixed(1))
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Monthly timeline trend
  const monthMap = {};
  for (const t of list) {
    const dateObj = new Date(t.transactionDate || t.createdAt || Date.now());
    const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
    const key = `${validDate.getFullYear()}-${String(validDate.getMonth() + 1).padStart(2, '0')}`;

    if (!monthMap[key]) {
      monthMap[key] = { month: key, income: 0, expense: 0, savings: 0 };
    }

    const amt = Number(t.amount || 0);
    if (t.type === 'income') {
      monthMap[key].income += amt;
    } else {
      monthMap[key].expense += amt;
    }
  }

  const monthlyTrend = Object.keys(monthMap)
    .sort()
    .map((month) => {
      const item = monthMap[month];
      return {
        month,
        income: item.income,
        expense: item.expense,
        savings: item.income - item.expense
      };
    });

  return {
    totalIncome,
    totalExpense,
    savings,
    budgetRemaining,
    monthlyBudget,
    categoryBreakdown,
    monthlyTrend
  };
};

export const analyzeFinance = ({ transactions = [], budget = null }) => {
  const summary = summarizeTransactions(transactions, budget);
  const list = Array.isArray(transactions) ? transactions : [];

  const insights = [];
  const recommendations = [];

  if (list.length === 0) {
    return {
      ...summary,
      insights: ['No transaction data recorded yet. Add your income and expenses to unlock insights!'],
      recommendations: ['Start by adding your daily transactions to track your finances accurately.'],
      predictedExpense: 0,
      confidence: 0
    };
  }

  // 1. Top Spending Category Insight
  if (summary.categoryBreakdown.length > 0) {
    const topCat = summary.categoryBreakdown[0];
    insights.push(
      `Your highest spending category is ${topCat.category}, totaling ${currency(topCat.amount)} (${topCat.percentage}% of total expenses).`
    );
  }

  // 2. Monthly Budget Usage Insight
  if (summary.monthlyBudget > 0) {
    const usagePercent = (summary.totalExpense / summary.monthlyBudget) * 100;
    if (usagePercent > 100) {
      insights.push(
        `Budget Exceeded: You have exceeded your monthly budget by ${currency(summary.totalExpense - summary.monthlyBudget)} (${usagePercent.toFixed(1)}% utilized).`
      );
      recommendations.push(
        `Consider curbing discretionary expenses in ${summary.categoryBreakdown[0]?.category || 'high spend categories'} to recover balance.`
      );
    } else if (usagePercent >= 80) {
      insights.push(
        `Budget Alert: You have used ${usagePercent.toFixed(1)}% of your monthly budget. ${currency(summary.budgetRemaining)} remaining.`
      );
      recommendations.push(`Monitor your non-essential spending closely for the remainder of the month.`);
    } else {
      insights.push(
        `Healthy Budget: You have utilized ${usagePercent.toFixed(1)}% of your budget with ${currency(summary.budgetRemaining)} remaining.`
      );
    }
  }

  // 3. Category-level Budget Overruns
  if (budget?.categoryBudgets && Array.isArray(budget.categoryBudgets)) {
    for (const catBudget of budget.categoryBudgets) {
      const match = summary.categoryBreakdown.find(
        (c) => c.category.toLowerCase() === catBudget.category.toLowerCase()
      );
      const spent = match ? match.amount : 0;
      if (spent > catBudget.limit) {
        insights.push(
          `Category Overspend: ${catBudget.category} expenses (${currency(spent)}) exceeded your limit of ${currency(catBudget.limit)}.`
        );
        recommendations.push(
          `Aim to reduce ${catBudget.category} costs by ${currency(spent - catBudget.limit)} to meet your target.`
        );
      }
    }
  }

  // 4. Savings Analysis
  if (summary.savings < 0) {
    insights.push(
      `Cash Flow Deficit: Total expenses exceed income by ${currency(Math.abs(summary.savings))}.`
    );
    recommendations.push(`Audit recent purchases and minimize non-essential subscriptions or lifestyle expenses.`);
  } else if (summary.totalIncome > 0) {
    const savingsRate = (summary.savings / summary.totalIncome) * 100;
    insights.push(
      `Positive Savings Rate: You saved ${savingsRate.toFixed(1)}% of your total earnings (${currency(summary.savings)}).`
    );
    if (savingsRate >= 20) {
      recommendations.push(`Solid financial discipline! Consider investing surplus savings into emergency funds or assets.`);
    }
  }

  // 5. Actionable Trimming Recommendation
  if (summary.categoryBreakdown.length > 0 && summary.totalExpense > 0) {
    const top = summary.categoryBreakdown[0];
    const potentialSaving = Math.round(top.amount * 0.15);
    recommendations.push(
      `Reducing ${top.category} spending by 15% would yield an extra ${currency(potentialSaving)} in monthly savings.`
    );
  }

  // 6. Expense Prediction Methodology
  // Historical monthly expense buckets averaged
  const expenseMonths = summary.monthlyTrend.map((m) => m.expense).filter((e) => e > 0);
  let predictedExpense = 0;
  if (expenseMonths.length > 0) {
    predictedExpense = Math.round(expenseMonths.reduce((a, b) => a + b, 0) / expenseMonths.length);
  } else {
    predictedExpense = summary.totalExpense;
  }

  // Confidence calculation (clamped between 55% and 95%)
  const txFactor = Math.min(list.length * 3, 35);
  const monthsFactor = Math.min(summary.monthlyTrend.length * 15, 45);
  const rawConfidence = 15 + txFactor + monthsFactor;
  const confidence = Math.min(Math.max(rawConfidence, 55), 95);

  return {
    ...summary,
    insights,
    recommendations,
    predictedExpense,
    confidence
  };
};