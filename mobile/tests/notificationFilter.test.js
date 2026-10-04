import {
  isSensitiveNotification,
  sanitizeNotificationText,
  extractAmount,
  extractTransactionType,
  extractMerchant,
  generateEventFingerprint,
  filterAndNormalizeNotification,
  FINANCIAL_PACKAGES,
  DEBIT_KEYWORDS,
  CREDIT_KEYWORDS,
  TRANSACTION_SIGNALS,
} from '../src/services/notificationFilter.js';

describe('FinTrack Mobile - On-Device Notification Filter & Sanitizer Unit Tests', () => {
  describe('1. Sensitive Data Detection & Zero-OTP Rejection', () => {
    it('should detect and flag OTP notifications as sensitive', () => {
      expect(isSensitiveNotification('HDFC Bank', 'Your OTP is 482910 for txn.')).toBe(true);
      expect(isSensitiveNotification('SBI Card', 'One Time Password: 992019.')).toBe(true);
      expect(isSensitiveNotification('ICICI', 'Use 448102 as your verification code.')).toBe(true);
      expect(isSensitiveNotification('Auth', 'Your secret PIN is 8812.')).toBe(true);
      expect(isSensitiveNotification('Security', 'Security code 492019 for login alert.')).toBe(true);
      expect(isSensitiveNotification('Bank', 'Never share your CVV or password with anyone.')).toBe(true);
      expect(isSensitiveNotification('Google', 'Your password reset code is 781920.')).toBe(true);
    });

    it('should return false for standard financial transaction alerts', () => {
      expect(isSensitiveNotification('Google Pay', 'Paid ₹480 to Swiggy via UPI.')).toBe(false);
      expect(isSensitiveNotification('HDFC Bank', 'INR 1,250 debited from A/c XX4521 at Amazon.')).toBe(false);
      expect(isSensitiveNotification('Salary', 'Rs 45,000 credited towards monthly salary.')).toBe(false);
      expect(isSensitiveNotification('com.google.android.apps.messaging', 'TEST: You paid Rs 350 at ABC Store using UPI. Transaction successful.')).toBe(false);
      expect(isSensitiveNotification('com.google.android.apps.messaging', 'ABC Store paid ₹350.00 using UPI. Transaction successful.')).toBe(false);
    });
  });

  describe('2. Account Number & PII Sanitization', () => {
    it('should mask 12-16 digit account and card numbers to last 4 digits', () => {
      const raw = 'Amount debited from account 1234567890123456 for Amazon India.';
      const sanitized = sanitizeNotificationText(raw);
      expect(sanitized).not.toContain('1234567890123456');
      expect(sanitized).toContain('A/c XX3456');
    });
  });

  describe('3. Amount Extraction', () => {
    it('should extract amounts with various currency symbols and comma separators', () => {
      expect(extractAmount('Paid ₹480 to Swiggy').amount).toBe(480);
      expect(extractAmount('INR 1,250.50 debited').amount).toBe(1250.5);
      expect(extractAmount('Rs. 30,000 credited').amount).toBe(30000);
      expect(extractAmount('Payment of Rs 850 successful').amount).toBe(850);
      expect(extractAmount('You paid Rs 350 at ABC Store').amount).toBe(350);
      expect(extractAmount('ABC Store paid ₹350.00 using UPI').amount).toBe(350);
      expect(extractAmount('Hello world, no money here').amount).toBeNull();
      expect(extractAmount('Order #12345 is confirmed').amount).toBeNull();
    });
  });

  describe('4. Transaction Type Differentiating', () => {
    it('should accurately categorize debits as expenses and credits as income', () => {
      expect(extractTransactionType('₹480 debited from account').type).toBe('expense');
      expect(extractTransactionType('Rs 1,250 paid to Amazon').type).toBe('expense');
      expect(extractTransactionType('You paid Rs 350 at ABC Store using UPI').type).toBe('expense');
      expect(extractTransactionType('ABC Store paid ₹350.00 using UPI').type).toBe('expense');
      expect(extractTransactionType('INR 45,000 credited as monthly salary').type).toBe('income');
      expect(extractTransactionType('Refund of ₹250 received').type).toBe('income');
      expect(extractTransactionType('Salary of Rs 45,000 received from TECH CORP').type).toBe('income');
    });
  });

  describe('5. Merchant Extraction', () => {
    it('should extract merchant name from natural language notification text', () => {
      expect(extractMerchant('Google Pay', 'Paid ₹480 to SWIGGY via UPI').merchant).toBe('SWIGGY');
      expect(extractMerchant('PhonePe', 'Paid Rs 1,250 at AMAZON INDIA').merchant).toBe('AMAZON INDIA');
      expect(extractMerchant('HDFC Bank', 'Payment of ₹320 for Uber Rides').merchant).toBe('Uber Rides');
      expect(extractMerchant('Messages', 'TEST: You paid Rs 350 at ABC Store using UPI. Transaction successful.').merchant).toBe('ABC Store');
      expect(extractMerchant('Messages', 'ABC Store paid ₹350.00 using UPI. Transaction successful.').merchant).toBe('ABC Store');
    });
  });

  describe('6. Deterministic Event Fingerprint', () => {
    it('should generate identical fingerprints for matching notification attributes', () => {
      const fp1 = generateEventFingerprint({
        merchant: 'Swiggy',
        amount: 480,
        type: 'expense',
        date: new Date('2026-09-26T00:00:00Z'),
        reference: 'com.phonepe.app',
      });

      const fp2 = generateEventFingerprint({
        merchant: 'Swiggy',
        amount: 480,
        type: 'expense',
        date: new Date('2026-09-26T12:00:00Z'),
        reference: 'com.phonepe.app',
      });

      expect(fp1).toBe(fp2);
    });

    it('should generate different fingerprints for different amounts or merchants', () => {
      const fp1 = generateEventFingerprint({
        merchant: 'Swiggy',
        amount: 480,
        type: 'expense',
        date: new Date('2026-09-26'),
      });

      const fp2 = generateEventFingerprint({
        merchant: 'Amazon',
        amount: 480,
        type: 'expense',
        date: new Date('2026-09-26'),
      });

      expect(fp1).not.toBe(fp2);
    });
  });

  describe('7. Master Filter & Normalization Pipeline', () => {
    it('should discard sensitive OTP notification immediately on-device', () => {
      const raw = {
        packageName: 'com.google.android.apps.nbu.paisa.user',
        title: 'Bank Verification Code',
        text: 'Your OTP is 482910 to approve transaction of ₹500.',
        postTime: Date.now(),
      };

      const result = filterAndNormalizeNotification(raw);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('SENSITIVE_AUTH_DISCARDED');
    });

    it('should discard sensitive PIN / CVV notifications immediately', () => {
      const raw = {
        packageName: 'com.google.android.apps.messaging',
        title: 'Bank Alert',
        text: 'Do not share your PIN 1234 or CVV 567 for txn of Rs 1000.',
        postTime: Date.now(),
      };

      const result = filterAndNormalizeNotification(raw);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('SENSITIVE_AUTH_DISCARDED');
    });

    it('should discard non-financial messages lacking financial amount', () => {
      const raw = {
        packageName: 'com.google.android.apps.messaging',
        title: 'Order Status',
        text: 'Order #98721 has been shipped by Amazon. Delivery by 5pm.',
        postTime: Date.now(),
      };

      const result = filterAndNormalizeNotification(raw);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('NO_FINANCIAL_AMOUNT');
    });

    it('should discard non-financial WhatsApp messages lacking financial verbs', () => {
      const raw = {
        packageName: 'com.whatsapp',
        title: 'Rahul',
        text: 'Hey bro, are we meeting today at 5pm?',
        postTime: Date.now(),
      };

      const result = filterAndNormalizeNotification(raw);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('NO_FINANCIAL_AMOUNT');
    });

    it('should normalize synthetic test SMS: TEST: You paid Rs 350 at ABC Store using UPI', () => {
      const raw = {
        packageName: 'com.google.android.apps.messaging',
        title: 'Google Messages',
        text: 'TEST: You paid Rs 350 at ABC Store using UPI. Transaction successful.',
        postTime: new Date('2026-09-27T10:00:00Z').getTime(),
      };

      const result = filterAndNormalizeNotification(raw);
      expect(result.isValid).toBe(true);
      expect(result.source).toBe('notification');
      expect(result.merchant).toBe('ABC Store');
      expect(result.amount).toBe(350);
      expect(result.type).toBe('expense');
      expect(result.fingerprint).toBeDefined();
    });

    it('should normalize synthetic test SMS: ABC Store paid ₹350.00 using UPI', () => {
      const raw = {
        packageName: 'com.google.android.apps.messaging',
        title: '',
        text: 'ABC Store paid ₹350.00 using UPI. Transaction successful.',
        postTime: new Date('2026-09-27T10:00:00Z').getTime(),
      };

      const result = filterAndNormalizeNotification(raw);
      expect(result.isValid).toBe(true);
      expect(result.source).toBe('notification');
      expect(result.merchant).toBe('ABC Store');
      expect(result.amount).toBe(350);
      expect(result.type).toBe('expense');
      expect(result.fingerprint).toBeDefined();
    });

    it('should normalize valid financial push notification from PhonePe to Swiggy', () => {
      const raw = {
        packageName: 'com.phonepe.app',
        title: 'Payment Successful',
        text: 'Paid ₹480 to SWIGGY via UPI Ref: 48291029.',
        postTime: new Date('2026-09-26T14:30:00Z').getTime(),
      };

      const result = filterAndNormalizeNotification(raw);
      expect(result.isValid).toBe(true);
      expect(result.source).toBe('notification');
      expect(result.merchant).toBe('SWIGGY');
      expect(result.amount).toBe(480);
      expect(result.type).toBe('expense');
      expect(result.fingerprint).toBeDefined();
      expect(result.appName).toBe('PhonePe');
    });

    it('should normalize valid salary credit notification from HDFC Bank', () => {
      const raw = {
        packageName: 'com.hdfc.bank',
        title: 'Salary Credit Alert',
        text: 'Your A/c XX8901 is credited with INR 45,000.00 from TECH CORP.',
        postTime: new Date('2026-09-26T10:00:00Z').getTime(),
      };

      const result = filterAndNormalizeNotification(raw);
      expect(result.isValid).toBe(true);
      expect(result.source).toBe('notification');
      expect(result.amount).toBe(45000);
      expect(result.type).toBe('income');
    });
  });
});
