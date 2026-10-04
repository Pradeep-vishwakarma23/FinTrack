import {
  parseSingleSMS,
  processSMSBatch,
  redactSensitiveData,
  extractAmount,
  extractTransactionType
} from '../services/smsParserService.js';
import request from 'supertest';
import app from '../app.js';
import jwt from 'jsonwebtoken';

describe('Phase 2: SMS Parser & Entity Extraction Unit Tests', () => {
  test('1. UPI message parsing extracts merchant, amount, type, and category', () => {
    const msg = 'UPI payment of Rs.480 to SWIGGY on 26-09-2026 was successful. Ref: UPI48192019';
    const result = parseSingleSMS(msg);

    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(480);
    expect(result.type).toBe('expense');
    expect(result.merchant).toBe('Swiggy');
    expect(result.category).toBe('Food');
    expect(result.sourceReference).toBe('UPI48192019');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  test('2. Debit message parsing extracts amount and merchant for Amazon', () => {
    const msg = 'INR 1,250 debited from your A/c 5491 for AMAZON on 25-09-2026. Txn ID: AMZ99210';
    const result = parseSingleSMS(msg);

    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(1250);
    expect(result.type).toBe('expense');
    expect(result.merchant).toBe('Amazon');
    expect(result.category).toBe('Shopping');
  });

  test('3. Credit message parsing identifies income type', () => {
    const msg = 'Your account has been credited with Rs.5000 on 20-09-2026';
    const result = parseSingleSMS(msg);

    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(5000);
    expect(result.type).toBe('income');
  });

  test('4. Salary message parsing classifies as Salary category with high confidence', () => {
    const msg = 'Rs 30,000 credited to your account. Salary credit from INFOSYS TECHNOLOGIES on 25-09-2026';
    const result = parseSingleSMS(msg);

    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(30000);
    expect(result.type).toBe('income');
    expect(result.category).toBe('Salary');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test('5. ATM withdrawal parsing sets merchant to ATM Cash Withdrawal', () => {
    const msg = 'ATM withdrawal of Rs.3000 from SBI ATM Koramangala on 11-09-2026';
    const result = parseSingleSMS(msg);

    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(3000);
    expect(result.type).toBe('expense');
    expect(result.merchant).toContain('ATM');
  });

  test('6. Bill payment parsing identifies Utilities/Bills category', () => {
    const msg = 'Electricity bill payment of Rs.1200 to BESCOM completed successfully on 23-09-2026';
    const result = parseSingleSMS(msg);

    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(1200);
    expect(result.type).toBe('expense');
    expect(result.category).toBe('Bills');
  });

  test('7. Sensitive data redaction sanitizes OTPs, PINs, and full account numbers', () => {
    const raw = 'Your OTP is 481920 for card 1234567890123456. PIN 9988 is confidential.';
    const redacted = redactSensitiveData(raw);

    expect(redacted).not.toContain('481920');
    expect(redacted).not.toContain('1234567890123456');
    expect(redacted).not.toContain('9988');
    expect(redacted).toContain('REDACTED');
    expect(redacted).toContain('A/c XX3456');
  });

  test('8. Amount extraction handles Rs, INR, ₹, and comma-formatted values', () => {
    expect(extractAmount('Paid Rs.480 to Swiggy').amount).toBe(480);
    expect(extractAmount('INR 1,250 debited').amount).toBe(1250);
    expect(extractAmount('₹650 to Uber').amount).toBe(650);
    expect(extractAmount('Rs 30,000 credited').amount).toBe(30000);
    expect(extractAmount('No amount here').amount).toBeNull();
  });

  test('9. Type detection accurately differentiates debit, credit, and transfers', () => {
    expect(extractTransactionType('INR 500 debited from account').type).toBe('expense');
    expect(extractTransactionType('Rs 10000 credited as salary').type).toBe('income');
    expect(extractTransactionType('Refund of Rs 200 credited').type).toBe('income');
  });

  test('10. Invalid non-financial messages are safely rejected', () => {
    const nonFinancialMsg = 'Dear customer, your daily data pack of 1.5GB is 100% used.';
    const result = parseSingleSMS(nonFinancialMsg);

    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/no financial transaction/i);
  });
});

describe('Phase 2: Batch SMS Processing & Duplicate Intelligence Tests', () => {
  test('processSMSBatch extracts transactions and calculates metrics & fingerprints', async () => {
    const messages = [
      { text: 'UPI payment of Rs.480 to SWIGGY on 26-09-2026', date: '2026-09-26' },
      { text: 'Your OTP is 981204', date: '2026-09-26' }, // Non-financial
      { text: 'Rs 95,000 credited to account. Salary credit from INFOSYS', date: '2026-09-25' },
      { text: 'UPI payment of Rs.480 to SWIGGY on 26-09-2026', date: '2026-09-26' } // Duplicate
    ];

    const { stagedTransactions, metrics } = await processSMSBatch(
      messages,
      '60d0fe4f5311236168a109ca'
    );

    expect(stagedTransactions).toHaveLength(3); // 3 valid, 1 invalid OTP
    expect(metrics.parsedCount).toBe(3);
    expect(metrics.rejectedCount).toBe(1);
    expect(metrics.duplicateCount).toBe(1);
    expect(stagedTransactions[2].isDuplicate).toBe(true);
    expect(metrics.totalIncome).toBe(95000);
    expect(metrics.totalExpense).toBe(960);
  });
});

describe('Phase 2: Ingestion API Endpoint & Auth Isolation Security Tests', () => {
  const JWT_SECRET = 'test_jwt_secret_key_1234567890abcdef';

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  test('POST /api/imports/sms rejects unauthorized requests with 401', async () => {
    const res = await request(app).post('/api/imports/sms').send({
      messages: [{ text: 'Paid Rs.500 to Swiggy' }]
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/imports/sms validates missing message payload with 400', async () => {
    const token = jwt.sign({ id: '60d0fe4f5311236168a109ca', role: 'user' }, JWT_SECRET, {
      expiresIn: '1h'
    });

    const res = await request(app)
      .post('/api/imports/sms')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/at least one SMS message/i);
  });

  test('POST /api/imports/sms rejects non-financial message payload with 400', async () => {
    const token = jwt.sign({ id: '60d0fe4f5311236168a109ca', role: 'user' }, JWT_SECRET, {
      expiresIn: '1h'
    });

    const res = await request(app)
      .post('/api/imports/sms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        messages: [{ text: 'Your OTP is 881290 for login.' }]
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/No financial transaction messages/i);
  });
});
