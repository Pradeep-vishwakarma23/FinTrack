import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { parseMonthQuery } from './intelligenceController.js';
import {
  calculateFinancialMetrics,
  calculateCategorySpending
} from '../services/bankingIntelligenceService.js';

/**
 * GET /api/dashboard/summary
 * Consolidated dashboard metrics aligned strictly with Phase 6.1 Banking Intelligence.
 * Operates on confirmed transactions for the selected/current month.
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const { startDate, endDate, monthKey } = parseMonthQuery(req.query.month);

    const [currentTransactions, allConfirmedTransactions, budget, stagedCount] = await Promise.all([
      Transaction.find({
        userId: req.userId,
        status: 'confirmed',
        transactionDate: { $gte: startDate, $lte: endDate }
      }).sort({ transactionDate: -1 }),
      Transaction.find({
        userId: req.userId,
        status: 'confirmed'
      }).sort({ transactionDate: -1 }),
      Budget.findOne({ userId: req.userId }),
      Transaction.countDocuments({ userId: req.userId, status: 'staged' })
    ]);

    // 1. Authoritative monthly financial metrics from Banking Intelligence
    const metrics = calculateFinancialMetrics(currentTransactions, budget);
    const categorySpending = calculateCategorySpending(currentTransactions, budget);

    const categoryBreakdown = categorySpending.map((c) => ({
      category: c.category,
      amount: c.amount,
      percentage: c.percentage
    }));

    // 2. Historical monthly timeline trend from all confirmed transactions
    const monthMap = {};
    for (const t of allConfirmedTransactions) {
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

    return res.status(200).json({
      success: true,
      period: monthKey,
      data: {
        totalIncome: metrics.totalIncome,
        totalExpense: metrics.totalExpense,
        savings: metrics.netSavings,
        savingsRate: metrics.savingsRate,
        budgetRemaining: metrics.budgetRemaining,
        monthlyBudget: metrics.monthlyBudget,
        categoryBudgets: budget?.categoryBudgets || [],
        monthlyTrend,
        categoryBreakdown,
        recentTransactions: allConfirmedTransactions.slice(0, 5),
        stagedCount: stagedCount || 0
      }
    });
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching dashboard summary'
    });
  }
};