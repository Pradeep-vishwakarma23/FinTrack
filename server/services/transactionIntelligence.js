import crypto from 'crypto';

const MERCHANT_PATTERNS = [
  { pattern: /swiggy/i, name: 'Swiggy', category: 'Food', confidence: 0.95 },
  { pattern: /zomato/i, name: 'Zomato', category: 'Food', confidence: 0.95 },
  { pattern: /blinkit|zepto|instamart|bigbasket|dunzo/i, name: 'Grocery Delivery', category: 'Food', confidence: 0.92 },
  { pattern: /mcdonald|starbucks|domino|kfc|pizza hut|subway|burger king|cafe/i, name: 'Restaurant / Cafe', category: 'Food', confidence: 0.90 },
  { pattern: /uber|ola|rapido|blusmart/i, name: 'Cab Service', category: 'Transport', confidence: 0.95 },
  { pattern: /metro|irctc|indian rail|makemytrip|goibibo|redbus|yatra/i, name: 'Travel / Transit', category: 'Transport', confidence: 0.92 },
  { pattern: /petrol|fuel|hpcl|bpcl|ioccl|shell/i, name: 'Fuel Station', category: 'Transport', confidence: 0.95 },
  { pattern: /amazon|amzn/i, name: 'Amazon', category: 'Shopping', confidence: 0.95 },
  { pattern: /flipkart/i, name: 'Flipkart', category: 'Shopping', confidence: 0.95 },
  { pattern: /myntra|ajio|zara|h&m|nykaa|meesho|tata cliq/i, name: 'Fashion Retail', category: 'Shopping', confidence: 0.92 },
  { pattern: /netflix|spotify|hotstar|prime video|disney|apple music|youtube/i, name: 'Digital Subscription', category: 'Entertainment', confidence: 0.98 },
  { pattern: /pvr|inox|cinepolis|bookmyshow/i, name: 'Movies & Events', category: 'Entertainment', confidence: 0.95 },
  { pattern: /airtel|jio|vodafone|vi post|act corp|hathway|tatasky/i, name: 'Telecom / Internet', category: 'Bills', confidence: 0.95 },
  { pattern: /electricity|bescom|tneb|mseb|adani|water|gas|indane|hp gas/i, name: 'Utility Provider', category: 'Bills', confidence: 0.95 },
  { pattern: /apollo|pharmeasy|netmeds|medplus|1mg|hospital|clinic|doctor|pharmacy/i, name: 'Healthcare & Pharmacy', category: 'Healthcare', confidence: 0.92 },
  { pattern: /coursera|udemy|edx|upgrad|unacademy|byju|college|school|tuition/i, name: 'Education Service', category: 'Education', confidence: 0.92 },
  { pattern: /zerodha|groww|upstox|kuvera|indmoney|mutual fund|sip|camsonline/i, name: 'Investment Platform', category: 'Investments', confidence: 0.95 },
  { pattern: /salary|payroll|wages|stipend|employer/i, name: 'Salary / Employer', category: 'Salary', confidence: 0.98 },
  { pattern: /rent|landlord|maintenance|housing society/i, name: 'Rent / Housing', category: 'Rent', confidence: 0.92 }
];

const CATEGORY_KEYWORDS = {
  Food: ['food', 'dining', 'restaurant', 'supermarket', 'groceries', 'mart', 'sweet', 'bakery', 'tea', 'coffee', 'snacks'],
  Shopping: ['shopping', 'store', 'mall', 'retail', 'cloth', 'apparel', 'electronics', 'purchase', 'bazaar'],
  Transport: ['transport', 'transit', 'parking', 'toll', 'fastag', 'auto', 'bus', 'train', 'flight'],
  Bills: ['bill', 'recharge', 'dth', 'broadband', 'postpaid', 'utility', 'invoice', 'insurance', 'premium'],
  Entertainment: ['entertainment', 'game', 'gaming', 'steam', 'playstation', 'club', 'resort', 'fun'],
  Healthcare: ['health', 'medical', 'medicine', 'lab', 'diagnostic', 'dental', 'care'],
  Education: ['education', 'course', 'books', 'stationery', 'exam', 'fees', 'institute'],
  Salary: ['salary', 'payroll', 'credit interest', 'dividend', 'incentive'],
  Investments: ['investment', 'stocks', 'equity', 'gold', 'crypto', 'shares', 'trading'],
  Rent: ['rent', 'lease', 'flat', 'hostel', 'pg accommodation'],
  Transfer: ['transfer', 'neft', 'imps', 'upi transfer', 'p2p', 'sent to', 'received from']
};

export const extractMerchantAndCategory = (rawText = '', existingMerchant = '', existingCategory = '') => {
  const text = `${existingMerchant} ${rawText}`.trim();

  // 1. Check direct merchant patterns
  for (const item of MERCHANT_PATTERNS) {
    if (item.pattern.test(text)) {
      return {
        merchant: existingMerchant || item.name,
        category: existingCategory || item.category,
        confidence: item.confidence,
        reason: `Matched merchant pattern for ${item.name}`
      };
    }
  }

  // 2. Keyword fallback for categories
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return {
          merchant: existingMerchant || (rawText.length > 30 ? rawText.slice(0, 30) : rawText) || 'Merchant',
          category: existingCategory || category,
          confidence: 0.75,
          reason: `Matched keyword "${kw}" for category ${category}`
        };
      }
    }
  }

  // 3. Low-confidence fallback
  return {
    merchant: existingMerchant || (rawText.length > 30 ? rawText.slice(0, 30) : rawText) || 'Other Party',
    category: existingCategory || 'Other',
    confidence: 0.45,
    reason: 'Generic transaction; manual category review suggested'
  };
};

export const generateTransactionFingerprint = ({
  userId,
  date,
  amount,
  merchant,
  reference,
  type
}) => {
  const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
  const cleanAmount = Number(amount || 0).toFixed(2);
  const cleanMerchant = String(merchant || '').trim().toLowerCase();
  const cleanRef = String(reference || '').trim().toLowerCase();
  const cleanType = String(type || 'expense').toLowerCase();

  const payload = `${String(userId)}_${dateStr}_${cleanAmount}_${cleanMerchant}_${cleanRef}_${cleanType}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};

export const enrichTransactions = async (transactions = [], userId, existingFingerprints = new Set()) => {
  const enriched = [];
  const localFingerprints = new Set(existingFingerprints);

  for (const t of transactions) {
    const textToAnalyze = `${t.title || ''} ${t.description || ''} ${t.merchant || ''}`;
    const intelligence = extractMerchantAndCategory(textToAnalyze, t.merchant, t.category);

    const merchant = intelligence.merchant || t.merchant || t.title || 'Unknown Merchant';
    const category = intelligence.category || t.category || 'Other';
    const confidence = Number(intelligence.confidence.toFixed(2));

    const fingerprint = generateTransactionFingerprint({
      userId,
      date: t.date,
      amount: t.amount,
      merchant,
      reference: t.reference,
      type: t.type
    });

    const isDuplicate = localFingerprints.has(fingerprint);
    localFingerprints.add(fingerprint);

    enriched.push({
      ...t,
      merchant,
      category,
      confidence,
      fingerprint,
      isDuplicate,
      intelligenceReason: intelligence.reason
    });
  }

  return enriched;
};

export const generateFingerprint = generateTransactionFingerprint;
export const detectDuplicate = (fingerprint, existingSet) => {
  if (existingSet instanceof Set) {
    return existingSet.has(fingerprint);
  }
  if (Array.isArray(existingSet)) {
    return existingSet.some(item => (typeof item === 'string' ? item === fingerprint : item.fingerprint === fingerprint));
  }
  return false;
};


