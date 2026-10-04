/**
 * On-Device Local Notification Filter & Sanitizer
 * Executes on the mobile client BEFORE any data is transmitted to the backend.
 * Guarantees zero-OTP retention, local non-financial rejection, and event normalization.
 */

// Known financial & UPI packages
export const FINANCIAL_PACKAGES = {
  'com.google.android.apps.nbu.paisa.user': 'Google Pay',
  'net.one97.paytm': 'Paytm',
  'com.phonepe.app': 'PhonePe',
  'in.org.npci.upiapp': 'BHIM UPI',
  'com.sbi.upi': 'SBI Yono',
  'com.hdfc.bank': 'HDFC Mobile Banking',
  'com.icici.bank': 'iMobile ICICI',
  'com.axis.bank': 'Axis Mobile',
  'com.kotak.bank': 'Kotak 811',
  'com.cred.android': 'CRED',
  'com.freecharge.android': 'Freecharge',
  'com.mobikwik_new': 'MobiKwik',
};

// Known social & non-financial packages to strictly filter
export const NON_FINANCIAL_PACKAGES = [
  'com.whatsapp',
  'com.instagram.android',
  'com.facebook.katana',
  'com.facebook.orca',
  'com.google.android.youtube',
  'com.android.chrome',
  'org.telegram.messenger',
  'com.twitter.android',
  'com.snapchat.android',
  'com.linkedin.android',
];

// Sensitive keywords that require IMMEDIATE local discard (Zero-OTP Guarantee)
const SENSITIVE_REGEX = /\b(?:otp|one time password|verification code|security code|pin|cvv|password|secret code|login alert|authentication code|reset code)\b/i;

// Transaction amount regex for INR / Rs / ₹ / amount / amt
const AMOUNT_REGEX = /(?:(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)|(?:amount of\s*|amt:?\s*|for\s*)(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|₹))/i;

// Debit & expense transaction keywords
export const DEBIT_KEYWORDS = [
  'debited', 'debit', 'spent', 'paid to', 'paid for', 'paid at', 'paid via',
  'paid', 'sent to', 'transferred to', 'transfer to', 'withdrawn', 'purchase',
  'charged', 'deducted', 'payment of', 'payment', 'auto-debit', 'auto-debited',
  'bill payment', 'money sent'
];

// Credit & income transaction keywords
export const CREDIT_KEYWORDS = [
  'credited', 'credit', 'received', 'deposited', 'refund', 'refunded', 'cashback',
  'salary credit', 'salary credited', 'added to account', 'dividend', 'dividend credited',
  'interest credited', 'reversed', 'money received', 'cr'
];

// Transaction signal keywords supporting UPI, bank SMS, and digital receipts
export const TRANSACTION_SIGNALS = [
  'upi', 'transaction', 'txn', 'transfer', 'transferred', 'reference', 'ref',
  'utr', 'vpa', 'imps', 'neft', 'rtgs', 'successful', 'success', 'completed',
  'a/c', 'acct', 'account', 'bank'
];

/**
 * Checks if notification contains sensitive authentication/security tokens
 */
export const isSensitiveNotification = (title = '', text = '') => {
  const combined = `${title} ${text}`.trim();
  return SENSITIVE_REGEX.test(combined);
};

/**
 * Sanitizes remaining notification text by masking account numbers
 */
export const sanitizeNotificationText = (text = '') => {
  if (typeof text !== 'string') return '';
  return text.replace(/\b(?:a\/c|acct|account|card)\s*(?:no\.?|number|#)?\s*(?:is|:)?\s*([0-9]{6,16})\b/gi, (match, acc) => {
    return `A/c XX${acc.slice(-4)}`;
  });
};

/**
 * Extracts numeric financial amount
 */
export const extractAmount = (text = '') => {
  const match = text.match(AMOUNT_REGEX);
  if (!match) return { amount: null, confidence: 0 };

  const rawNum = match[1] || match[2] || match[3];
  if (!rawNum) return { amount: null, confidence: 0 };

  const cleanNum = parseFloat(rawNum.replace(/,/g, ''));
  if (isNaN(cleanNum) || cleanNum <= 0) {
    return { amount: null, confidence: 0 };
  }

  return { amount: cleanNum, confidence: 0.98 };
};

/**
 * Extracts debit vs credit type
 */
export const extractTransactionType = (text = '') => {
  const lower = text.toLowerCase();

  for (const kw of CREDIT_KEYWORDS) {
    const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
    if (regex.test(lower)) {
      return { type: 'income', confidence: kw.includes('salary') ? 0.98 : 0.92 };
    }
  }

  for (const kw of DEBIT_KEYWORDS) {
    const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
    if (regex.test(lower)) {
      return { type: 'expense', confidence: 0.95 };
    }
  }

  if (/\b(?:credit|cr)\b/i.test(lower)) {
    return { type: 'income', confidence: 0.8 };
  }

  return { type: 'expense', confidence: 0.7 };
};

/**
 * Extracts target merchant from notification
 */
export const extractMerchant = (title = '', text = '', pkg = '') => {
  const cleanTitle = (title || '').trim();
  const cleanBody = (text || '').trim();
  const combined = `${cleanTitle} ${cleanBody}`.trim();
  
  // Clean off trailing reference / payment channel / balance info like "via UPI", "Ref: 123", "on 26-Sep", "using UPI"
  const sanitizeTarget = (str) =>
    str.replace(/\s+(?:via\s+upi|via\s+imps|via\s+neft|via\s+[A-Za-z]+|using\s+[A-Za-z]+|ref:?\s*\w+|utr:?\s*\w+|a\/c\s*\w+|bal:?\s*\w+)\b.*$/i, '');

  const cleanText = sanitizeTarget(cleanBody || combined);
  const cleanCombined = sanitizeTarget(combined);

  // Common non-merchant words to exclude
  const invalidWords = ['your', 'my', 'account', 'bank', 'upi', 'imps', 'neft', 'card', 'via', 'test', 'alert', 'messages', 'sms', 'notification'];

  // Helper to test if a candidate string is a valid merchant name
  const isValidCandidate = (cand) => {
    if (!cand || typeof cand !== 'string') return false;
    let clean = cand.trim().replace(/^(the|a|an)\s+/i, '').replace(/[.,;:]+$/, '').trim();
    if (clean.length < 2) return false;
    if (invalidWords.includes(clean.toLowerCase())) return false;
    return clean;
  };

  // 1. Standard preposition match on body text or combined: "paid to X", "at X", "to X", "for X", "from X", "info: X"
  for (const targetStr of [cleanText, cleanCombined]) {
    const match = targetStr.match(/(?:paid\s+to|paid\s+for|paid\s+at|sent\s+to|transferred\s+to|\bto\b|\bfor\b|\bat\b|\btowards\b|\bfrom\b|\binfo:?)\s+([A-Za-z0-9&.\-']+(?:\s+[A-Za-z0-9&.\-']+){0,3})(?=\s+(?:on|via|using|ref|utr|avl|bal|a\/c|upi)|[.,]|$)/i);
    if (match && match[1]) {
      const candidate = isValidCandidate(match[1]);
      if (candidate) {
        return { merchant: candidate, confidence: 0.88 };
      }
    }
  }

  // 2. Leading merchant pattern on body: "ABC Store: Paid Rs 350", "ABC Store paid ₹350", "SWIGGY - Rs 480"
  for (const targetStr of [cleanText, cleanCombined]) {
    const leadingMatch = targetStr.match(/^([A-Za-z0-9&.\-']+(?:\s+[A-Za-z0-9&.\-']+){0,2})[:\-]?\s+(?:paid|debited|spent|credited|received|payment|via)/i);
    if (leadingMatch && leadingMatch[1]) {
      let cand = leadingMatch[1].trim().replace(/^(test:?|alert:?|you|your|messages:?|sms:?)\s+/i, '');
      const candidate = isValidCandidate(cand);
      if (candidate) {
        return { merchant: candidate, confidence: 0.85 };
      }
    }
  }

  // 3. Fallback to title if title looks like a merchant name
  if (cleanTitle && cleanTitle.length > 2 && cleanTitle.length <= 30) {
    const candidate = isValidCandidate(cleanTitle);
    if (candidate && !cleanTitle.toLowerCase().includes('successful')) {
      return { merchant: candidate, confidence: 0.75 };
    }
  }

  const appName = FINANCIAL_PACKAGES[pkg] || 'UPI / Bank Alert';
  return { merchant: appName, confidence: 0.6 };
};

/**
 * Generate deterministic local event fingerprint for duplicate rejection
 */
export const generateEventFingerprint = ({ merchant, amount, type, date, reference }) => {
  const dateStr = date ? new Date(date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const cleanAmount = Number(amount || 0).toFixed(2);
  const cleanMerchant = String(merchant || '').trim().toLowerCase();
  const cleanType = String(type || 'expense').toLowerCase();
  const cleanRef = String(reference || '').trim().toLowerCase();

  return `notif_${dateStr}_${cleanAmount}_${cleanMerchant}_${cleanType}_${cleanRef}`;
};

/**
 * Master On-Device Filter & Normalizer
 * @param {Object} rawNotification - { packageName, title, text, postTime }
 */
export const filterAndNormalizeNotification = (rawNotification = {}) => {
  const {
    packageName = '',
    title = '',
    text = '',
    postTime = Date.now(),
  } = rawNotification;

  const combinedText = `${title} ${text}`.trim();

  // 1. Sensitive Check: Discard immediately if OTP or credentials present (Zero-OTP Guarantee)
  if (isSensitiveNotification(title, text)) {
    return {
      isValid: false,
      reason: 'SENSITIVE_AUTH_DISCARDED',
      details: 'Sensitive authentication token or OTP detected and discarded on-device.',
    };
  }

  // 2. Amount Check: Discard if no valid currency amount
  const amountResult = extractAmount(combinedText);
  if (!amountResult.amount) {
    return {
      isValid: false,
      reason: 'NO_FINANCIAL_AMOUNT',
      details: 'Notification does not contain a financial transaction amount.',
    };
  }

  // 3. Financial Relevance Check
  const isKnownFinanceApp = Boolean(FINANCIAL_PACKAGES[packageName]);
  const isBlockedSocial = NON_FINANCIAL_PACKAGES.includes(packageName);

  const hasDebitVerb = DEBIT_KEYWORDS.some((kw) => {
    const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
    return regex.test(combinedText);
  });
  const hasCreditVerb = CREDIT_KEYWORDS.some((kw) => {
    const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
    return regex.test(combinedText);
  });
  const hasFinancialVerb = hasDebitVerb || hasCreditVerb;

  const hasTransactionSignal = TRANSACTION_SIGNALS.some((sig) => {
    const regex = new RegExp(`\\b${sig.replace('.', '\\.')}\\b`, 'i');
    return regex.test(combinedText);
  });

  const isFinancialContent = isKnownFinanceApp || hasFinancialVerb || hasTransactionSignal;

  if (isBlockedSocial && !hasFinancialVerb) {
    return {
      isValid: false,
      reason: 'NON_FINANCIAL_APP',
      details: 'Notification from non-financial application without strong transaction verbs.',
    };
  }

  if (!isFinancialContent) {
    return {
      isValid: false,
      reason: 'NON_FINANCIAL_CONTENT',
      details: 'Notification lacks transaction verb or payment signal indicators.',
    };
  }

  // 4. Normalization
  const typeResult = extractTransactionType(combinedText);
  const merchantResult = extractMerchant(title, text, packageName);
  const sanitizedText = sanitizeNotificationText(text || title);
  const eventDate = new Date(postTime);

  const fingerprint = generateEventFingerprint({
    merchant: merchantResult.merchant,
    amount: amountResult.amount,
    type: typeResult.type,
    date: eventDate,
    reference: packageName,
  });

  const overallConfidence = Number(
    (
      amountResult.confidence * 0.4 +
      typeResult.confidence * 0.3 +
      merchantResult.confidence * 0.3
    ).toFixed(2)
  );

  return {
    isValid: true,
    source: 'notification',
    packageName,
    appName: FINANCIAL_PACKAGES[packageName] || 'Financial App',
    title: merchantResult.merchant,
    merchant: merchantResult.merchant,
    amount: amountResult.amount,
    type: typeResult.type,
    category: 'Other',
    confidence: overallConfidence,
    transactionDate: eventDate.toISOString(),
    description: sanitizedText,
    fingerprint,
    sanitized: true,
    detectedAt: new Date().toISOString(),
  };
};

export default {
  FINANCIAL_PACKAGES,
  NON_FINANCIAL_PACKAGES,
  DEBIT_KEYWORDS,
  CREDIT_KEYWORDS,
  TRANSACTION_SIGNALS,
  isSensitiveNotification,
  sanitizeNotificationText,
  extractAmount,
  extractTransactionType,
  extractMerchant,
  generateEventFingerprint,
  filterAndNormalizeNotification,
};
