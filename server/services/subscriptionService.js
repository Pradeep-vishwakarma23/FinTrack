import Transaction from '../models/Transaction.js';

/**
 * Normalizes merchant names to group recurring payments accurately.
 * Cleans punctuation, excess whitespace, and common noise tokens while preserving identity.
 */
export const normalizeMerchantName = (merchantStr, titleStr) => {
  const raw = (merchantStr && merchantStr.trim().length > 0)
    ? merchantStr
    : (titleStr && titleStr.trim().length > 0 ? titleStr : 'Unknown Merchant');

  let normalized = raw.toLowerCase().trim();

  // Strip common payment prefixes
  normalized = normalized.replace(/^(autopay|nach|si|upi|pos|e-mandate|mandate|billdesk|razorpay|paytm|cc)\s*[-:]*\s*/gi, '');

  // Strip non-alphanumeric except spaces
  normalized = normalized.replace(/[^\w\s]/g, ' ');

  // Repeatedly strip trailing entity, regional, and domain noise tokens
  let prev;
  do {
    prev = normalized;
    normalized = normalized
      .replace(/\s+(pvt\s+ltd|private\s+limited|pvt|ltd|limited|inc|corp|llc|india|in|com|net)\s*$/gi, '')
      .trim();
  } while (normalized !== prev);

  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized || raw.toLowerCase().trim();
};

/**
 * Calculates days between two date objects.
 */
const getDayDifference = (d1, d2) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.abs((new Date(d2).getTime() - new Date(d1).getTime()) / msPerDay);
};

/**
 * Calculates standard deviation of a number array.
 */
const calculateStdDev = (arr, mean) => {
  if (arr.length <= 1) return 0;
  const squareDiffs = arr.map((val) => Math.pow(val - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / (arr.length - 1);
  return Math.sqrt(avgSquareDiff);
};

/**
 * Detects payment cadence from transaction intervals.
 */
export const detectCadence = (intervals) => {
  if (!intervals || intervals.length < 2) {
    return { cadence: 'irregular', averageIntervalDays: 0, isConsistent: false };
  }

  const avgInterval = intervals.reduce((sum, d) => sum + d, 0) / intervals.length;
  const stdDev = calculateStdDev(intervals, avgInterval);

  // Weekly: ~6-8 days
  if (avgInterval >= 6 && avgInterval <= 8 && stdDev <= 3) {
    return { cadence: 'weekly', averageIntervalDays: Math.round(avgInterval), isConsistent: true, stdDev };
  }

  // Biweekly: ~13-16 days
  if (avgInterval >= 13 && avgInterval <= 16 && stdDev <= 4) {
    return { cadence: 'biweekly', averageIntervalDays: Math.round(avgInterval), isConsistent: true, stdDev };
  }

  // Monthly: ~25-35 days
  if (avgInterval >= 25 && avgInterval <= 35 && stdDev <= 6) {
    return { cadence: 'monthly', averageIntervalDays: Math.round(avgInterval), isConsistent: true, stdDev };
  }

  // Quarterly: ~80-105 days
  if (avgInterval >= 80 && avgInterval <= 105 && stdDev <= 12) {
    return { cadence: 'quarterly', averageIntervalDays: Math.round(avgInterval), isConsistent: true, stdDev };
  }

  return { cadence: 'irregular', averageIntervalDays: Math.round(avgInterval), isConsistent: false, stdDev };
};

/**
 * Estimates the next expected payment date based on cadence and last payment date.
 */
export const estimateNextPaymentDate = (lastDateStr, cadence) => {
  if (!lastDateStr || !cadence || cadence === 'irregular') return null;

  const lastDate = new Date(lastDateStr);
  if (isNaN(lastDate.getTime())) return null;

  const nextDate = new Date(lastDate);

  switch (cadence) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    default:
      return null;
  }

  return nextDate.toISOString();
};

/**
 * Analyzes transaction amounts to detect consistency, price increases, and changes.
 */
export const analyzeAmounts = (amounts) => {
  if (!amounts || amounts.length === 0) {
    return {
      averageAmount: 0,
      latestAmount: 0,
      previousAmount: 0,
      minAmount: 0,
      maxAmount: 0,
      amountChange: 0,
      percentageChange: 0,
      priceIncreaseDetected: false,
      isAmountConsistent: false
    };
  }

  const count = amounts.length;
  const latestAmount = amounts[count - 1];
  const previousAmount = count > 1 ? amounts[count - 2] : latestAmount;
  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);
  const sum = amounts.reduce((acc, a) => acc + a, 0);
  const averageAmount = Math.round((sum / count) * 100) / 100;

  const stdDev = calculateStdDev(amounts, averageAmount);
  const cv = averageAmount > 0 ? stdDev / averageAmount : 0; // Coefficient of variation

  // Price increase detection: Latest amount is noticeably higher than previous
  let priceIncreaseDetected = false;
  let amountChange = 0;
  let percentageChange = 0;

  if (count >= 3 && latestAmount > previousAmount) {
    const diff = latestAmount - previousAmount;
    const pct = (diff / previousAmount) * 100;
    // Price hike threshold: at least 3% increase and at least ₹20
    if (pct >= 3 && diff >= 20) {
      priceIncreaseDetected = true;
      amountChange = Math.round(diff * 100) / 100;
      percentageChange = Math.round(pct * 10) / 10;
    }
  }

  return {
    averageAmount,
    latestAmount,
    previousAmount,
    minAmount,
    maxAmount,
    amountChange,
    percentageChange,
    priceIncreaseDetected,
    isAmountConsistent: cv <= 0.15,
    cv
  };
};

/**
 * Evaluates deterministic confidence score and maps to HIGH/MEDIUM/LOW levels.
 */
export const calculateConfidence = ({ count, cadenceInfo, amountInfo, lastPaymentDate, referenceDate = null }) => {
  let score = 0;

  // 1. Frequency Evidence
  if (count >= 5) {
    score += 45;
  } else if (count === 4) {
    score += 35;
  } else if (count === 3) {
    score += 25;
  } else {
    return { confidence: 10, confidenceLevel: 'LOW' };
  }

  // 2. Cadence Consistency
  if (cadenceInfo.isConsistent) {
    score += 30;
    if (cadenceInfo.stdDev <= 2) {
      score += 10;
    }
  } else {
    score -= 20;
  }

  // 3. Amount Consistency
  if (amountInfo.minAmount === amountInfo.maxAmount) {
    score += 20;
  } else if (amountInfo.priceIncreaseDetected) {
    score += 15; // Structured step increase (e.g. subscription price hike)
  } else if (amountInfo.isAmountConsistent) {
    score += 10;
  } else {
    score -= 10;
  }

  // 4. Recency of last payment
  const refDate = referenceDate ? new Date(referenceDate) : new Date();
  const daysSinceLast = getDayDifference(lastPaymentDate, refDate);
  if (cadenceInfo.cadence === 'monthly' && daysSinceLast <= 45) {
    score += 5;
  } else if (cadenceInfo.cadence === 'weekly' && daysSinceLast <= 14) {
    score += 5;
  } else if (daysSinceLast > 120) {
    score -= 20; // Inactive or abandoned subscription
  }

  const boundedScore = Math.max(0, Math.min(100, score));

  let confidenceLevel = 'LOW';
  if (boundedScore >= 75) {
    confidenceLevel = 'HIGH';
  } else if (boundedScore >= 50) {
    confidenceLevel = 'MEDIUM';
  }

  return {
    confidence: boundedScore,
    confidenceLevel
  };
};

/**
 * Pure deterministic Recurring & Subscription Intelligence Engine.
 * Analyzes CONFIRMED expense transactions for the specified user.
 * Read-only with zero database mutation.
 */
export const detectRecurringSubscriptions = async ({ userId, transactions: injectedTransactions = null, referenceDate = null }) => {
  if (!userId) {
    const error = new Error('User ID is required for recurring detection.');
    error.statusCode = 400;
    throw error;
  }

  // Retrieve confirmed expense transactions strictly scoped to userId
  let transactions;
  if (injectedTransactions) {
    transactions = injectedTransactions.filter(
      (tx) => tx.status === 'confirmed' && tx.type === 'expense' && String(tx.userId) === String(userId)
    );
  } else {
    transactions = await Transaction.find({
      userId,
      status: 'confirmed',
      type: 'expense'
    }).sort({ transactionDate: 1 });
  }

  if (!transactions || transactions.length === 0) {
    return {
      subscriptions: [],
      summary: {
        totalRecurringCommitments: 0,
        estimatedMonthlyRecurringCost: 0,
        highConfidenceCount: 0,
        mediumConfidenceCount: 0
      }
    };
  }

  const datasetLatestDate = transactions.length > 0
    ? new Date(Math.max(...transactions.map((t) => new Date(t.transactionDate || t.date).getTime())))
    : new Date();
  const effectiveRefDate = referenceDate ? new Date(referenceDate) : datasetLatestDate;

  // 1. Group confirmed expense transactions by normalized merchant
  const groups = new Map();

  for (const tx of transactions) {
    const normMerchant = normalizeMerchantName(tx.merchant, tx.title);
    if (!groups.has(normMerchant)) {
      groups.set(normMerchant, {
        rawMerchant: tx.merchant || tx.title || 'Unknown Merchant',
        category: tx.category || 'Other',
        transactions: []
      });
    }
    groups.get(normMerchant).transactions.push(tx);
  }

  const subscriptions = [];

  // 2. Evaluate each merchant group
  for (const [normMerchant, group] of groups.entries()) {
    const txList = group.transactions.sort(
      (a, b) => new Date(a.transactionDate || a.date) - new Date(b.transactionDate || b.date)
    );

    // Minimum evidence rule: At least 3 transactions
    if (txList.length < 3) {
      continue;
    }

    // Calculate intervals between consecutive transactions
    const intervals = [];
    for (let i = 0; i < txList.length - 1; i++) {
      const d1 = txList[i].transactionDate || txList[i].date;
      const d2 = txList[i + 1].transactionDate || txList[i + 1].date;
      const days = getDayDifference(d1, d2);
      intervals.push(days);
    }

    const cadenceInfo = detectCadence(intervals);
    const amounts = txList.map((tx) => tx.amount);
    const amountInfo = analyzeAmounts(amounts);
    const lastTx = txList[txList.length - 1];
    const lastPaymentDate = new Date(lastTx.transactionDate || lastTx.date || Date.now()).toISOString();

    const { confidence, confidenceLevel } = calculateConfidence({
      count: txList.length,
      cadenceInfo,
      amountInfo,
      lastPaymentDate,
      referenceDate: effectiveRefDate
    });

    // Exclude LOW / NOT_RECURRING items from final active recurring list
    if (confidenceLevel === 'LOW' || !cadenceInfo.isConsistent) {
      continue;
    }

    const estimatedNextPaymentDate = estimateNextPaymentDate(lastPaymentDate, cadenceInfo.cadence);

    subscriptions.push({
      merchant: group.rawMerchant,
      normalizedMerchant: normMerchant,
      category: group.category,
      cadence: cadenceInfo.cadence,
      averageAmount: amountInfo.averageAmount,
      latestAmount: amountInfo.latestAmount,
      previousAmount: amountInfo.previousAmount,
      minAmount: amountInfo.minAmount,
      maxAmount: amountInfo.maxAmount,
      transactionCount: txList.length,
      confidence,
      confidenceLevel,
      lastPaymentDate,
      estimatedNextPaymentDate,
      amountChange: amountInfo.amountChange,
      percentageChange: amountInfo.percentageChange,
      priceIncreaseDetected: amountInfo.priceIncreaseDetected,
      evidence: {
        intervals,
        averageIntervalDays: cadenceInfo.averageIntervalDays,
        amounts
      }
    });
  }

  // Sort subscriptions: HIGH confidence first, then by monthly cost descending
  subscriptions.sort((a, b) => {
    if (a.confidenceLevel !== b.confidenceLevel) {
      return a.confidenceLevel === 'HIGH' ? -1 : 1;
    }
    return b.latestAmount - a.latestAmount;
  });

  // Calculate monthly summary
  let estimatedMonthlyRecurringCost = 0;
  let highConfidenceCount = 0;
  let mediumConfidenceCount = 0;

  for (const sub of subscriptions) {
    if (sub.confidenceLevel === 'HIGH') highConfidenceCount++;
    if (sub.confidenceLevel === 'MEDIUM') mediumConfidenceCount++;

    switch (sub.cadence) {
      case 'weekly':
        estimatedMonthlyRecurringCost += sub.latestAmount * 4.33;
        break;
      case 'biweekly':
        estimatedMonthlyRecurringCost += sub.latestAmount * 2.17;
        break;
      case 'quarterly':
        estimatedMonthlyRecurringCost += sub.latestAmount / 3;
        break;
      case 'monthly':
      default:
        estimatedMonthlyRecurringCost += sub.latestAmount;
        break;
    }
  }

  return {
    subscriptions,
    summary: {
      totalRecurringCommitments: subscriptions.length,
      estimatedMonthlyRecurringCost: Math.round(estimatedMonthlyRecurringCost * 100) / 100,
      highConfidenceCount,
      mediumConfidenceCount
    }
  };
};

export default {
  detectRecurringSubscriptions,
  normalizeMerchantName,
  detectCadence,
  estimateNextPaymentDate,
  analyzeAmounts,
  calculateConfidence
};
