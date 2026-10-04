import { extractMerchantAndCategory, generateTransactionFingerprint } from './transactionIntelligence.js';

// Sensitive patterns to redact before persistence
const SENSITIVE_PATTERNS = [
  { regex: /\b(?:otp|one time password|verification code)\s*(?:is|:)?\s*(\d{4,8})\b/gi, replacement: 'OTP: [REDACTED]' },
  { regex: /\b(?:pin|cvv|password|secret)\s*(?:is|:)?\s*([a-zA-Z0-9]{3,8})\b/gi, replacement: 'SECRET: [REDACTED]' },
  { regex: /\b(?:a\/c|acct|account|card)\s*(?:no\.?|number|#)?\s*(?:is|:)?\s*([0-9]{6,16})\b/gi, replacement: (match, acc) => `A/c XX${acc.slice(-4)}` }
];

export const redactSensitiveData = (rawText = '') => {
  if (typeof rawText !== 'string') return '';
  let sanitized = rawText;

  SENSITIVE_PATTERNS.forEach(({ regex, replacement }) => {
    if (typeof replacement === 'function') {
      sanitized = sanitized.replace(regex, replacement);
    } else {
      sanitized = sanitized.replace(regex, replacement);
    }
  });

  return sanitized;
};

// Amount regex matching various Indian currency formats
const AMOUNT_REGEX = /(?:(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)|(?:amount of\s*|amt:?\s*|for\s*)(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|₹))/i;

export const extractAmount = (text = '') => {
  const match = text.match(AMOUNT_REGEX);
  if (!match) return { amount: null, confidence: 0 };

  const rawNum = match[1] || match[2] || match[3];
  if (!rawNum) return { amount: null, confidence: 0 };

  const cleanNum = parseFloat(rawNum.replace(/,/g, ''));
  if (isNaN(cleanNum) || cleanNum <= 0) {
    return { amount: null, confidence: 0 };
  }

  return {
    amount: cleanNum,
    confidence: 0.98
  };
};

// Type keywords
const DEBIT_KEYWORDS = [
  'debited', 'spent', 'withdrawn', 'paid to', 'paid for', 'paid via',
  'purchase', 'charged', 'sent to', 'transfer to', 'atm withdrawal',
  'bill payment', 'deducted', 'payment of', 'auto-debited'
];

const CREDIT_KEYWORDS = [
  'credited', 'deposited', 'received', 'refund', 'cashback',
  'salary credit', 'salary credited', 'interest credited',
  'dividend credited', 'reversed', 'added to account'
];

export const extractTransactionType = (text = '') => {
  const lower = text.toLowerCase();

  for (const kw of CREDIT_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        type: 'income',
        confidence: kw.includes('salary') ? 0.98 : 0.92,
        reason: `Matched credit indicator "${kw}"`
      };
    }
  }

  for (const kw of DEBIT_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        type: 'expense',
        confidence: 0.95,
        reason: `Matched debit indicator "${kw}"`
      };
    }
  }

  // Fallback heuristic based on generic words
  if (lower.includes('credit') || lower.includes('cr')) {
    return { type: 'income', confidence: 0.8, reason: 'Matched CR indicator' };
  }

  return { type: 'expense', confidence: 0.7, reason: 'Defaulted to expense' };
};

// Date extraction regex
const DATE_PATTERNS = [
  /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
  /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:\d{2,4})?)/i,
  /(\d{4}-\d{2}-\d{2})/
];

export const extractDate = (text = '', fallbackDate = null) => {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) {
        return { date: parsed, confidence: 0.95 };
      }
    }
  }

  if (fallbackDate) {
    const parsedFallback = new Date(fallbackDate);
    if (!isNaN(parsedFallback.getTime())) {
      return { date: parsedFallback, confidence: 0.9 };
    }
  }

  return { date: new Date(), confidence: 0.6 };
};

// Reference / UTR / Txn ID extraction
const REF_PATTERNS = [
  /(?:ref(?:\s*no\.?|erence)?|utr|txn\s*id|transaction\s*id|vpa|chq)\s*[:\-]?\s*([A-Za-z0-9]+)/i,
  /UPI\/([A-Za-z0-9]+)/i
];

export const extractReference = (text = '') => {
  for (const pattern of REF_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
};

// Target merchant pattern extraction from natural SMS strings
export const extractSMSMerchant = (text = '', rawIntelligence) => {
  if (rawIntelligence && rawIntelligence.merchant && rawIntelligence.merchant !== 'Other Party' && rawIntelligence.merchant !== 'Merchant') {
    return {
      merchant: rawIntelligence.merchant,
      confidence: rawIntelligence.confidence || 0.9
    };
  }

  // Regex patterns: "to [MERCHANT]", "for [MERCHANT]", "from [MERCHANT]"
  const targetMatch = text.match(/(?:to|for|at|towards|from|info:?)\s+([A-Za-z0-9\s&.\-']{2,30}?)(?=\s+(?:on|via|using|ref|utr|avl|bal|a\/c|\.|,|$))/i);
  if (targetMatch && targetMatch[1]) {
    const candidate = targetMatch[1].trim().replace(/^(the|a|an)\s+/i, '');
    if (candidate.length >= 2 && !['your', 'my', 'account', 'bank', 'upi', 'imps', 'neft'].includes(candidate.toLowerCase())) {
      return {
        merchant: candidate,
        confidence: 0.85
      };
    }
  }

  return {
    merchant: rawIntelligence?.merchant || 'Unknown Merchant',
    confidence: 0.5
  };
};

/**
 * Main Single SMS Message Parser
 */
export const parseSingleSMS = (rawMessage, fallbackDate = null, index = 1) => {
  const text = typeof rawMessage === 'string' ? rawMessage : rawMessage.text || rawMessage.body || '';
  const messageDate = rawMessage.date || fallbackDate;
  const messageSender = rawMessage.sender || rawMessage.from || 'SMS';

  const sanitizedText = redactSensitiveData(text.trim());

  if (!sanitizedText || sanitizedText.length < 10) {
    return {
      isValid: false,
      rawRowIndex: index,
      reason: 'Message text is too short or empty'
    };
  }

  // 1. Amount
  const amountResult = extractAmount(sanitizedText);
  if (!amountResult.amount) {
    return {
      isValid: false,
      rawRowIndex: index,
      rawText: sanitizedText,
      reason: 'No financial transaction amount detected'
    };
  }

  // 2. Type (Debit vs Credit)
  const typeResult = extractTransactionType(sanitizedText);

  // 3. Date
  const dateResult = extractDate(sanitizedText, messageDate);

  // 4. Reference
  const reference = extractReference(sanitizedText) || (rawMessage.id ? String(rawMessage.id) : '');

  // 5. Merchant & Category via Transaction Intelligence
  const intelligence = extractMerchantAndCategory(sanitizedText);
  const merchantResult = extractSMSMerchant(sanitizedText, intelligence);

  // If ATM withdrawal
  let category = intelligence.category || 'Other';
  let merchant = merchantResult.merchant;
  if (/atm\s+withdrawal|withdrawn\s+at\s+atm/i.test(sanitizedText)) {
    merchant = 'ATM Cash Withdrawal';
    category = 'Transfer';
  }

  // 6. Overall Weighted Confidence Calculation
  const amountWeight = 0.35;
  const typeWeight = 0.25;
  const merchantWeight = 0.20;
  const catWeight = 0.15;
  const dateWeight = 0.05;

  const overallConfidence = Number(
    (
      amountResult.confidence * amountWeight +
      typeResult.confidence * typeWeight +
      merchantResult.confidence * merchantWeight +
      (intelligence.confidence || 0.7) * catWeight +
      dateResult.confidence * dateWeight
    ).toFixed(2)
  );

  return {
    isValid: true,
    rawRowIndex: index,
    title: merchant || sanitizedText.slice(0, 50),
    merchant,
    amount: amountResult.amount,
    type: typeResult.type,
    category,
    date: dateResult.date,
    source: 'sms',
    sourceReference: reference,
    externalTransactionId: reference,
    confidence: Math.min(0.99, Math.max(0.1, overallConfidence)),
    status: 'staged',
    description: sanitizedText,
    metadata: {
      originalSender: messageSender,
      sanitizedText,
      confidenceBreakdown: {
        amount: amountResult.confidence,
        type: typeResult.confidence,
        merchant: merchantResult.confidence,
        category: intelligence.confidence || 0.7,
        date: dateResult.confidence
      }
    }
  };
};

/**
 * Batch SMS Messages Ingestion & Enrichment Pipeline
 */
export const processSMSBatch = async (messages = [], userId, existingFingerprints = new Set()) => {
  const results = [];
  const localFingerprints = new Set(existingFingerprints);
  let parsedCount = 0;
  let rejectedCount = 0;
  let duplicateCount = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let highConf = 0;
  let lowConf = 0;

  messages.forEach((msg, idx) => {
    const parsed = parseSingleSMS(msg, msg?.date || null, idx + 1);

    if (!parsed.isValid) {
      rejectedCount++;
      return;
    }

    parsedCount++;

    const fingerprint = generateTransactionFingerprint({
      userId,
      date: parsed.date,
      amount: parsed.amount,
      merchant: parsed.merchant,
      reference: parsed.sourceReference,
      type: parsed.type
    });

    const isDuplicate = localFingerprints.has(fingerprint);
    localFingerprints.add(fingerprint);
    if (isDuplicate) duplicateCount++;

    if (parsed.type === 'income') totalIncome += parsed.amount;
    else totalExpense += parsed.amount;

    if (parsed.confidence >= 0.8) highConf++;
    else if (parsed.confidence < 0.6) lowConf++;

    results.push({
      ...parsed,
      fingerprint,
      isDuplicate,
      paymentMethod: 'upi' // SMS transactions default to UPI / digital banking
    });
  });

  return {
    stagedTransactions: results,
    metrics: {
      totalReceived: messages.length,
      parsedCount,
      rejectedCount,
      duplicateCount,
      totalIncome,
      totalExpense,
      highConfidenceCount: highConf,
      lowConfidenceCount: lowConf
    }
  };
};
