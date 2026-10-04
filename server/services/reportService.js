import PDFDocument from 'pdfkit';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import ActionPlan from '../models/ActionPlan.js';
import {
  calculateFinancialMetrics,
  calculateCategorySpending,
  calculateMerchantAnalytics,
  detectAnomalies
} from './bankingIntelligenceService.js';
import { calculateMultiMonthTrends } from './trendIntelligenceService.js';
import { detectRecurringSubscriptions } from './subscriptionService.js';
import { enrichGoalWithCalculations } from './goalService.js';

const formatCurrency = (value = 0) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (date) => {
  const d = new Date(date);
  return isNaN(d.getTime())
    ? '-'
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Validates whether string is in strict 'YYYY-MM' format.
 */
export const isValidMonthFormat = (monthStr) => {
  if (!monthStr || typeof monthStr !== 'string') return false;
  const match = monthStr.trim().match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  return Boolean(match);
};

/**
 * Parses month string into start and end Date bounds.
 */
export const parseMonthBounds = (monthStr) => {
  let year;
  let monthIndex; // 0-11

  if (isValidMonthFormat(monthStr)) {
    const [y, m] = monthStr.trim().split('-').map(Number);
    year = y;
    monthIndex = m - 1;
  } else {
    throw new Error('Invalid month format. Expected YYYY-MM (e.g. 2026-09).');
  }

  const startDate = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  // End date is last millisecond of the month
  const endDate = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));

  return {
    year,
    monthIndex,
    monthNumber: monthIndex + 1,
    formattedMonth: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
    startDate,
    endDate
  };
};

/**
 * Pure deterministic generation of a complete financial report for a specific user and month.
 */
export const generateMonthlyReport = async ({ userId, month } = {}) => {
  if (!userId) {
    throw new Error('User ID is required to generate report.');
  }

  const { formattedMonth, startDate, endDate, year, monthNumber } = parseMonthBounds(month);

  // 1. Fetch strictly confirmed ledger transactions for this month and user
  const confirmedFilter = {
    userId,
    status: 'confirmed',
    $or: [
      { transactionDate: { $gte: startDate, $lte: endDate } },
      { date: { $gte: startDate, $lte: endDate } }
    ]
  };

  const [
    transactions,
    budget,
    goals,
    actionPlans,
    recurringData,
    trendsData
  ] = await Promise.all([
    Transaction.find(confirmedFilter).sort({ transactionDate: -1, date: -1 }),
    Budget.findOne({ userId }),
    Goal.find({ userId }),
    ActionPlan.find({ userId, status: { $in: ['ACTIVE', 'active'] } }),
    detectRecurringSubscriptions({ userId }),
    calculateMultiMonthTrends({ userId, range: '6m', referenceMonth: formattedMonth })
  ]);

  // 2. Compute Core Financial Metrics & Summary
  const metrics = calculateFinancialMetrics(transactions, budget);
  const totalIncome = metrics.totalIncome || 0;
  const totalExpenses = metrics.totalExpense || 0;
  const netSavings = metrics.netSavings || 0;
  const savingsRate = metrics.savingsRate || 0;

  // 3. Category Spending Analysis
  const rawCategories = calculateCategorySpending(transactions, budget);
  const categories = rawCategories.map((c) => ({
    category: c.category,
    amount: c.amount,
    percentage: c.percentage,
    count: c.count,
    budgetLimit: c.budgetLimit,
    budgetUtilization: c.budgetUtilization,
    isOverBudget: c.isOverBudget
  }));

  // 4. Merchant Analytics
  const rawMerchants = calculateMerchantAnalytics(transactions, { limit: 10 });
  const merchants = rawMerchants.map((m) => ({
    merchant: m.merchant,
    totalSpending: m.totalSpend,
    transactionCount: m.count,
    averageTicket: m.averageTicket,
    percentage: m.percentage
  }));

  // 5. Budget Performance
  let budgetPerformance = null;
  if (budget && budget.monthlyBudget > 0) {
    const monthlyBudget = Number(budget.monthlyBudget) || 0;
    const spent = totalExpenses;
    const remaining = Number((monthlyBudget - spent).toFixed(2));
    const utilization = monthlyBudget > 0 ? Number(((spent / monthlyBudget) * 100).toFixed(1)) : 0;
    let riskLevel = 'Low';
    if (utilization > 100) riskLevel = 'Exceeded';
    else if (utilization >= 90) riskLevel = 'High';
    else if (utilization >= 75) riskLevel = 'Moderate';

    budgetPerformance = {
      monthlyBudget,
      spent,
      remaining,
      utilization,
      riskLevel
    };
  }

  // 6. Trend Performance
  const activeTrendMonths = (trendsData?.months || []).filter(
    (m) => m.transactionCount > 0 || m.income > 0 || m.expenses > 0
  );
  const trendsAvailable = activeTrendMonths.length >= 2;
  const trends = {
    available: trendsAvailable,
    activeMonthsCount: activeTrendMonths.length,
    savingsMomentum: trendsData?.summary?.savingsMomentum || 'INSUFFICIENT_DATA',
    expenseTrend: trendsData?.summary?.expenseTrend || 'stable',
    incomeTrend: trendsData?.summary?.incomeTrend || 'stable',
    savingsTrend: trendsData?.summary?.savingsTrend || 'stable',
    message: trendsAvailable ? null : 'Insufficient historical data for trend analysis.',
    historicalMonths: (trendsData?.months || []).map((m) => ({
      month: m.month,
      income: m.income,
      expenses: m.expenses,
      netSavings: m.netSavings,
      savingsRate: m.savingsRate
    }))
  };

  // 7. Recurring Commitments
  const recurring = (recurringData?.subscriptions || []).map((s) => ({
    merchant: s.merchantName || s.merchant || 'Unknown',
    cadence: s.cadence || 'monthly',
    typicalAmount: s.latestAmount || 0,
    nextExpectedPayment: s.nextExpectedPaymentDate ? new Date(s.nextExpectedPaymentDate).toISOString().slice(0, 10) : null,
    confidence: s.confidenceLevel || 'MEDIUM',
    category: s.category || 'Subscription',
    priceHikeDetected: Boolean(s.priceHikeDetected)
  }));

  // 8. Goals Status
  const enrichedGoals = goals.map((g) => {
    const enriched = enrichGoalWithCalculations(g, {
      referenceDate: endDate,
      netMonthlySavings: netSavings
    });
    return {
      goalId: enriched._id ? enriched._id.toString() : '',
      name: enriched.name || enriched.title || 'Goal',
      targetAmount: enriched.targetAmount || 0,
      currentAmount: enriched.currentAmount || 0,
      progressPercentage: enriched.progressPercentage || 0,
      remainingAmount: enriched.remainingAmount || 0,
      requiredMonthlySavings: enriched.requiredMonthlySavings || 0,
      status: enriched.status || 'in_progress',
      feasibility: enriched.feasibility?.status || 'UNKNOWN',
      feasibilityScore: enriched.feasibility?.score || 0
    };
  });

  // 9. Action Plans Status (With non-guaranteed impact terminology)
  const formattedActionPlans = actionPlans.map((p) => {
    const plain = typeof p.toObject === 'function' ? p.toObject() : p;
    return {
      planId: plain._id ? plain._id.toString() : '',
      title: plain.title || 'Financial Action',
      priority: plain.priority || 'MEDIUM',
      type: plain.actionType || plain.type || 'RECOMMENDATION',
      target: plain.category || plain.target || 'General',
      potentialMonthlyImpact: plain.monthlyImpact || 0,
      potentialSixMonthImpact: plain.potentialSixMonthImpact || (plain.monthlyImpact ? plain.monthlyImpact * 6 : 0),
      rationale: plain.rationale || plain.description || '',
      status: plain.status || 'ACTIVE'
    };
  });

  // 10. Anomalies
  const detected = detectAnomalies(transactions, budget);
  const anomalies = detected.map((a) => ({
    transactionId: a.transactionId || (a._id ? a._id.toString() : ''),
    merchant: a.merchant || a.title || 'Unknown',
    category: a.category || 'General',
    amount: a.amount || 0,
    severity: a.severity || 'LOW',
    reason: a.reason || 'Unusual expenditure detected'
  }));

  // 11. Transaction Summary
  const incomeTransactions = transactions.filter((t) => t.type === 'income').length;
  const expenseTransactions = transactions.filter((t) => t.type === 'expense').length;
  const transferTransactions = transactions.filter((t) => t.type === 'transfer').length;

  const transactionSummary = {
    incomeTransactions,
    expenseTransactions,
    transferTransactions,
    totalTransactions: transactions.length
  };

  return {
    reportMetadata: {
      userId: String(userId),
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      month: formattedMonth,
      year,
      monthNumber,
      generatedAt: new Date().toISOString()
    },
    summary: {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate
    },
    categories,
    merchants,
    budget: budgetPerformance,
    trends,
    recurring,
    goals: enrichedGoals,
    actionPlans: formattedActionPlans,
    anomalies,
    transactionSummary,
    transactions: transactions.map((t) => ({
      _id: t._id,
      title: t.title || 'Untitled',
      amount: t.amount,
      type: t.type,
      category: t.category || 'General',
      merchant: t.merchant || '',
      transactionDate: t.transactionDate || t.date
    }))
  };
};

/**
 * Builds and streams a professional PDF report to the HTTP response stream.
 */
export const generateMonthlyReportPDF = async ({ userId, month, res, format } = {}) => {
  const report = await generateMonthlyReport({ userId, month });

  const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

  if (format === 'base64') {
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      return res.status(200).json({
        success: true,
        filename: `FinTrack_Report_${report.reportMetadata.month}.pdf`,
        base64: pdfBuffer.toString('base64'),
        byteLength: pdfBuffer.length
      });
    });
  } else {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="FinTrack_Report_${report.reportMetadata.month}.pdf"`
    );
    doc.pipe(res);
  }

  const pageWidth = 595.28;
  const contentWidth = pageWidth - 80; // 515.28 pt

  // ==========================================
  // 1. HEADER SECTION
  // ==========================================
  doc.fillColor('#0f172a').fontSize(22).font('Helvetica-Bold').text('FinTrack Financial Report', 40, 40);
  doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(
    `Statement Period: ${report.reportMetadata.month}   |   Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    40,
    68
  );

  // Divider Line
  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, 88).lineTo(555, 88).stroke();

  // ==========================================
  // 2. FINANCIAL SUMMARY CARDS
  // ==========================================
  const startY = 102;
  const boxWidth = 120;
  const boxHeight = 54;
  const gap = 8;

  const summaryCards = [
    {
      label: 'Total Income',
      val: formatCurrency(report.summary.totalIncome),
      color: '#059669',
      bg: '#ecfdf5'
    },
    {
      label: 'Total Expenses',
      val: formatCurrency(report.summary.totalExpenses),
      color: '#dc2626',
      bg: '#fef2f2'
    },
    {
      label: 'Net Savings',
      val: formatCurrency(report.summary.netSavings),
      color: report.summary.netSavings >= 0 ? '#059669' : '#dc2626',
      bg: '#f8fafc'
    },
    {
      label: 'Savings Rate',
      val: `${report.summary.savingsRate}%`,
      color: report.summary.savingsRate >= 20 ? '#2563eb' : '#d97706',
      bg: '#eff6ff'
    }
  ];

  summaryCards.forEach((c, idx) => {
    const x = 40 + idx * (boxWidth + gap);
    doc.roundedRect(x, startY, boxWidth, boxHeight, 4).fillAndStroke(c.bg, '#e2e8f0');
    doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text(c.label, x + 8, startY + 9);
    doc.fillColor(c.color).fontSize(11).font('Helvetica-Bold').text(c.val, x + 8, startY + 26);
  });

  let currentY = startY + boxHeight + 20;

  // Helper to check page overflow and add page if needed
  const checkPageBreak = (neededHeight = 60) => {
    if (currentY + neededHeight > 760) {
      doc.addPage();
      currentY = 40;
    }
  };

  // ==========================================
  // 3. BUDGET & SPENDING PERFORMANCE
  // ==========================================
  if (report.budget) {
    checkPageBreak(70);
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Budget Performance', 40, currentY);
    currentY += 18;

    const b = report.budget;
    doc.roundedRect(40, currentY, contentWidth, 42, 4).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.font('Helvetica').fontSize(9).fillColor('#475569');
    doc.text(`Monthly Limit: ${formatCurrency(b.monthlyBudget)}`, 50, currentY + 8);
    doc.text(`Spent: ${formatCurrency(b.spent)} (${b.utilization}%)`, 200, currentY + 8);
    doc.text(`Remaining: ${formatCurrency(b.remaining)}`, 360, currentY + 8);
    doc.font('Helvetica-Bold');
    doc.fillColor(b.riskLevel === 'Exceeded' ? '#dc2626' : b.riskLevel === 'High' ? '#d97706' : '#059669');
    doc.text(`Risk: ${b.riskLevel}`, 50, currentY + 24);
    currentY += 56;
  }

  // ==========================================
  // 4. CATEGORY BREAKDOWN TABLE
  // ==========================================
  checkPageBreak(80);
  doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Expense Category Breakdown', 40, currentY);
  currentY += 18;

  if (report.categories.length === 0) {
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('No expense records found for this period.', 40, currentY);
    currentY += 18;
  } else {
    // Header
    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
    doc.text('Category', 40, currentY);
    doc.text('Amount', 240, currentY);
    doc.text('Share of Expenses', 380, currentY, { align: 'right', width: 175 });
    currentY += 14;
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, currentY).lineTo(555, currentY).stroke();
    currentY += 6;

    doc.font('Helvetica').fontSize(8.5).fillColor('#475569');
    report.categories.forEach((cat) => {
      checkPageBreak(18);
      doc.text(cat.category, 40, currentY);
      doc.text(formatCurrency(cat.amount), 240, currentY);
      doc.text(`${cat.percentage}%`, 380, currentY, { align: 'right', width: 175 });
      currentY += 15;
    });
    currentY += 10;
  }

  // ==========================================
  // 5. TOP MERCHANTS TABLE
  // ==========================================
  if (report.merchants.length > 0) {
    checkPageBreak(80);
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Top Merchant Spending', 40, currentY);
    currentY += 18;

    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
    doc.text('Merchant', 40, currentY);
    doc.text('Transactions', 260, currentY);
    doc.text('Total Spent', 400, currentY, { align: 'right', width: 155 });
    currentY += 14;
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, currentY).lineTo(555, currentY).stroke();
    currentY += 6;

    doc.font('Helvetica').fontSize(8.5).fillColor('#475569');
    report.merchants.slice(0, 5).forEach((m) => {
      checkPageBreak(18);
      doc.text(m.merchant, 40, currentY);
      doc.text(`${m.transactionCount} payments`, 260, currentY);
      doc.text(formatCurrency(m.totalSpending), 400, currentY, { align: 'right', width: 155 });
      currentY += 15;
    });
    currentY += 10;
  }

  // ==========================================
  // 6. TREND INTELLIGENCE & MOMENTUM
  // ==========================================
  checkPageBreak(65);
  doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Monthly Trends & Momentum', 40, currentY);
  currentY += 18;

  if (!report.trends.available) {
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Insufficient historical data for trend analysis.', 40, currentY);
    currentY += 18;
  } else {
    doc.roundedRect(40, currentY, contentWidth, 38, 4).fillAndStroke('#f1f5f9', '#e2e8f0');
    doc.font('Helvetica').fontSize(8.5).fillColor('#334155');
    doc.text(`Savings Momentum: ${report.trends.savingsMomentum}`, 50, currentY + 8);
    doc.text(`Income Trend: ${report.trends.incomeTrend}`, 230, currentY + 8);
    doc.text(`Expense Trend: ${report.trends.expenseTrend}`, 390, currentY + 8);
    doc.text(`Savings Trend: ${report.trends.savingsTrend}`, 50, currentY + 22);
    currentY += 48;
  }

  // ==========================================
  // 7. RECURRING COMMITMENTS
  // ==========================================
  if (report.recurring.length > 0) {
    checkPageBreak(75);
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Recurring Subscriptions & Fixed Obligations', 40, currentY);
    currentY += 18;

    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
    doc.text('Subscription', 40, currentY);
    doc.text('Cadence', 200, currentY);
    doc.text('Typical Amount', 320, currentY);
    doc.text('Next Due / Confidence', 420, currentY, { align: 'right', width: 135 });
    currentY += 14;
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, currentY).lineTo(555, currentY).stroke();
    currentY += 6;

    doc.font('Helvetica').fontSize(8.5).fillColor('#475569');
    report.recurring.forEach((sub) => {
      checkPageBreak(18);
      doc.text(sub.merchant, 40, currentY);
      doc.text(sub.cadence, 200, currentY);
      doc.text(formatCurrency(sub.typicalAmount), 320, currentY);
      doc.text(`${sub.nextExpectedPayment || 'N/A'} (${sub.confidence})`, 420, currentY, { align: 'right', width: 135 });
      currentY += 15;
    });
    currentY += 10;
  }

  // ==========================================
  // 8. GOALS
  // ==========================================
  if (report.goals.length > 0) {
    checkPageBreak(75);
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Savings Goals Progress', 40, currentY);
    currentY += 18;

    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
    doc.text('Goal', 40, currentY);
    doc.text('Target', 180, currentY);
    doc.text('Saved (% Progress)', 290, currentY);
    doc.text('Monthly Req / Status', 420, currentY, { align: 'right', width: 135 });
    currentY += 14;
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, currentY).lineTo(555, currentY).stroke();
    currentY += 6;

    doc.font('Helvetica').fontSize(8.5).fillColor('#475569');
    report.goals.forEach((g) => {
      checkPageBreak(18);
      doc.text(g.name, 40, currentY);
      doc.text(formatCurrency(g.targetAmount), 180, currentY);
      doc.text(`${formatCurrency(g.currentAmount)} (${g.progressPercentage}%)`, 290, currentY);
      doc.text(`${formatCurrency(g.requiredMonthlySavings)}/mo (${g.status})`, 420, currentY, { align: 'right', width: 135 });
      currentY += 15;
    });
    currentY += 10;
  }

  // ==========================================
  // 9. ACTION PLANS
  // ==========================================
  if (report.actionPlans.length > 0) {
    checkPageBreak(75);
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Prioritized Financial Action Plans', 40, currentY);
    currentY += 18;

    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
    doc.text('Action Plan', 40, currentY);
    doc.text('Priority / Target', 240, currentY);
    doc.text('Potential Monthly / 6-Mo Impact', 360, currentY, { align: 'right', width: 195 });
    currentY += 14;
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, currentY).lineTo(555, currentY).stroke();
    currentY += 6;

    doc.font('Helvetica').fontSize(8.5).fillColor('#475569');
    report.actionPlans.forEach((p) => {
      checkPageBreak(18);
      doc.text(p.title, 40, currentY);
      doc.text(`${p.priority} • ${p.target}`, 240, currentY);
      doc.text(`${formatCurrency(p.potentialMonthlyImpact)}/mo (${formatCurrency(p.potentialSixMonthImpact)} 6-mo)`, 360, currentY, { align: 'right', width: 195 });
      currentY += 15;
    });
    currentY += 10;
  }

  // ==========================================
  // 10. ANOMALIES
  // ==========================================
  if (report.anomalies.length > 0) {
    checkPageBreak(75);
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Detected Anomalies & Spending Shocks', 40, currentY);
    currentY += 18;

    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
    doc.text('Merchant / Item', 40, currentY);
    doc.text('Amount', 180, currentY);
    doc.text('Severity / Reason', 270, currentY, { width: 285 });
    currentY += 14;
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, currentY).lineTo(555, currentY).stroke();
    currentY += 6;

    doc.font('Helvetica').fontSize(8.5).fillColor('#475569');
    report.anomalies.forEach((a) => {
      checkPageBreak(18);
      doc.text(a.merchant, 40, currentY);
      doc.text(formatCurrency(a.amount), 180, currentY);
      doc.text(`[${a.severity}] ${a.reason}`, 270, currentY, { width: 285 });
      currentY += 18;
    });
    currentY += 10;
  }

  // ==========================================
  // 11. TRANSACTION HISTORY SUMMARY
  // ==========================================
  checkPageBreak(90);
  doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text(
    `Ledger Transactions (${report.transactionSummary.totalTransactions} items: ${report.transactionSummary.incomeTransactions} Inflow, ${report.transactionSummary.expenseTransactions} Outflow)`,
    40,
    currentY
  );
  currentY += 18;

  if (report.transactions.length === 0) {
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('No confirmed transactions recorded in this period.', 40, currentY);
  } else {
    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
    doc.text('Date', 40, currentY);
    doc.text('Title / Description', 120, currentY);
    doc.text('Category', 290, currentY);
    doc.text('Type', 390, currentY);
    doc.text('Amount', 460, currentY, { align: 'right', width: 95 });
    currentY += 14;
    doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(40, currentY).lineTo(555, currentY).stroke();
    currentY += 6;

    const maxRows = Math.min(report.transactions.length, 50);
    for (let i = 0; i < maxRows; i++) {
      const t = report.transactions[i];
      checkPageBreak(16);
      doc.font('Helvetica').fontSize(8).fillColor('#475569');
      doc.text(formatDate(t.transactionDate), 40, currentY);
      doc.text(t.title ? (t.title.length > 25 ? `${t.title.slice(0, 25)}...` : t.title) : 'Untitled', 120, currentY);
      doc.text(t.category || '-', 290, currentY);

      const isIncome = t.type === 'income';
      doc.fillColor(isIncome ? '#059669' : '#dc2626');
      doc.text(isIncome ? 'Income' : 'Expense', 390, currentY);
      doc.text(`${isIncome ? '+' : '-'}${formatCurrency(t.amount)}`, 460, currentY, { align: 'right', width: 95 });

      currentY += 15;
    }
  }

  // ==========================================
  // 12. PAGE NUMBERING & FOOTER
  // ==========================================
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor('#94a3b8').text(
      `Page ${i + 1} of ${range.count}   •   Confidential Financial Statement   •   FinTrack Platform`,
      40,
      800,
      { align: 'center', width: contentWidth }
    );
  }

  doc.end();
};

/**
 * Neutralizes potential CSV/Spreadsheet formula injection characters (=, +, -, @, \t, \r).
 * If a string begins with any formula trigger character, it is safely prefixed with a single quote (').
 * Does not alter numeric values or mutate stored database records.
 */
export const sanitizeSpreadsheetCell = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;

  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
};

export default {
  isValidMonthFormat,
  parseMonthBounds,
  generateMonthlyReport,
  generateMonthlyReportPDF,
  sanitizeSpreadsheetCell
};
