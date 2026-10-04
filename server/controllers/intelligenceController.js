import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import {
  calculateBankingIntelligenceSummary,
  calculateMerchantAnalytics,
  detectAnomalies,
  calculateForecastAndRisk
} from '../services/bankingIntelligenceService.js';
import { detectRecurringSubscriptions } from '../services/subscriptionService.js';
import { calculateMultiMonthTrends } from '../services/trendIntelligenceService.js';

/**
 * Parses month query string ('YYYY-MM') into bounded date objects and historical boundaries.
 */
export const parseMonthQuery = (monthQuery) => {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed

  if (monthQuery && typeof monthQuery === 'string') {
    const parts = monthQuery.trim().split('-');
    if (parts.length === 2) {
      const parsedYear = parseInt(parts[0], 10);
      const parsedMonth = parseInt(parts[1], 10) - 1;
      if (!isNaN(parsedYear) && !isNaN(parsedMonth) && parsedMonth >= 0 && parsedMonth <= 11) {
        year = parsedYear;
        month = parsedMonth;
      }
    }
  }

  const startDate = new Date(year, month, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
  const referenceDate = isCurrentMonth ? now : endDate;

  // Historical window: 90 days prior to target month start
  const historicalStart = new Date(startDate);
  historicalStart.setDate(historicalStart.getDate() - 90);

  return {
    year,
    month: month + 1,
    monthKey,
    startDate,
    endDate,
    referenceDate,
    historicalStart
  };
};

/**
 * GET /api/intelligence/summary
 * High-level banking intelligence snapshot (metrics, category breakdown, top merchants, anomalies, forecast)
 */
export const getSummary = async (req, res) => {
  try {
    const { startDate, endDate, referenceDate, historicalStart, monthKey } = parseMonthQuery(req.query.month);

    const [currentTransactions, historicalTransactions, budget] = await Promise.all([
      Transaction.find({
        userId: req.userId,
        status: 'confirmed',
        transactionDate: { $gte: startDate, $lte: endDate }
      }).sort({ transactionDate: -1 }),
      Transaction.find({
        userId: req.userId,
        status: 'confirmed',
        transactionDate: { $gte: historicalStart, $lt: startDate }
      }),
      Budget.findOne({ userId: req.userId })
    ]);

    const summary = calculateBankingIntelligenceSummary({
      currentTransactions,
      historicalTransactions,
      budget,
      referenceDate
    });

    return res.status(200).json({
      success: true,
      period: monthKey,
      data: summary
    });
  } catch (error) {
    console.error('getSummary error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error generating intelligence summary'
    });
  }
};

/**
 * GET /api/intelligence/merchants
 * Detailed merchant spending analytics, frequency, and average ticket size.
 */
export const getMerchants = async (req, res) => {
  try {
    const { startDate, endDate, monthKey } = parseMonthQuery(req.query.month);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);

    const transactions = await Transaction.find({
      userId: req.userId,
      status: 'confirmed',
      transactionDate: { $gte: startDate, $lte: endDate }
    }).sort({ transactionDate: -1 });

    const merchants = calculateMerchantAnalytics(transactions, { limit });

    return res.status(200).json({
      success: true,
      period: monthKey,
      count: merchants.length,
      data: merchants
    });
  } catch (error) {
    console.error('getMerchants error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching merchant analytics'
    });
  }
};

/**
 * GET /api/intelligence/anomalies
 * Detects spending outliers, budget shocks, and unusual debits.
 */
export const getAnomalies = async (req, res) => {
  try {
    const { startDate, endDate, historicalStart, monthKey } = parseMonthQuery(req.query.month);

    const [currentTransactions, historicalTransactions, budget] = await Promise.all([
      Transaction.find({
        userId: req.userId,
        status: 'confirmed',
        transactionDate: { $gte: startDate, $lte: endDate }
      }).sort({ transactionDate: -1 }),
      Transaction.find({
        userId: req.userId,
        status: 'confirmed',
        transactionDate: { $gte: historicalStart, $lt: startDate }
      }),
      Budget.findOne({ userId: req.userId })
    ]);

    const anomalies = detectAnomalies(currentTransactions, budget, historicalTransactions);

    return res.status(200).json({
      success: true,
      period: monthKey,
      count: anomalies.length,
      data: anomalies
    });
  } catch (error) {
    console.error('getAnomalies error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error detecting anomalies'
    });
  }
};

/**
 * GET /api/intelligence/forecast
 * Calculates daily burn rate, blended month-end forecast, and budget overrun risk.
 */
export const getForecast = async (req, res) => {
  try {
    const { startDate, endDate, referenceDate, historicalStart, monthKey } = parseMonthQuery(req.query.month);

    const [currentTransactions, historicalTransactions, budget] = await Promise.all([
      Transaction.find({
        userId: req.userId,
        status: 'confirmed',
        transactionDate: { $gte: startDate, $lte: endDate }
      }).sort({ transactionDate: -1 }),
      Transaction.find({
        userId: req.userId,
        status: 'confirmed',
        transactionDate: { $gte: historicalStart, $lt: startDate }
      }),
      Budget.findOne({ userId: req.userId })
    ]);

    const forecast = calculateForecastAndRisk({
      currentTransactions,
      historicalTransactions,
      budget,
      referenceDate
    });

    return res.status(200).json({
      success: true,
      period: monthKey,
      data: forecast
    });
  } catch (error) {
    console.error('getForecast error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error calculating expense forecast'
    });
  }
};

/**
 * GET /api/intelligence/subscriptions
 * Detects recurring subscriptions, fixed obligations, price increases, and upcoming payment dates.
 */
export const getSubscriptions = async (req, res) => {
  try {
    const result = await detectRecurringSubscriptions({ userId: req.userId });

    return res.status(200).json({
      success: true,
      subscriptions: result.subscriptions,
      summary: result.summary
    });
  } catch (error) {
    console.error('getSubscriptions error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error detecting recurring subscriptions'
    });
  }
};

/**
 * GET /api/intelligence/trends
 * Calculates multi-month financial trends (6m / 12m), MoM comparison, category variances, savings momentum, and extremes.
 */
export const getTrends = async (req, res) => {
  try {
    const range = req.query.range === '12m' ? '12m' : '6m';
    const referenceMonth = req.query.referenceMonth || req.query.month || null;

    const result = await calculateMultiMonthTrends({
      userId: req.userId,
      range,
      referenceMonth
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('getTrends error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error calculating financial trends'
    });
  }
};



