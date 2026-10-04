import { parseCSVBuffer, parseExcelBuffer, normalizeRawRecords } from '../services/fileParserService.js';
import {
  extractMerchantAndCategory,
  generateFingerprint,
  detectDuplicate,
  enrichTransactions
} from '../services/transactionIntelligence.js';
import request from 'supertest';
import app from '../app.js';
import jwt from 'jsonwebtoken';
import * as xlsx from 'xlsx';

describe('Phase 1: File Parser & Normalization Unit Tests', () => {
  test('parseCSVBuffer and normalizeRawRecords parses standard bank CSV with DD/MM/YYYY date format', async () => {
    const csvContent = `Date,Description,Withdrawal,Deposit
15/08/2025,SWIGGY BANGALORE IN,450.00,
16/08/2025,SALARY TECH CORP,,85000.00
17/08/2025,UBER INDIA RIDES,320.50,`;

    const buffer = Buffer.from(csvContent, 'utf-8');
    const rawRows = await parseCSVBuffer(buffer);
    const records = normalizeRawRecords(rawRows);

    expect(records).toHaveLength(3);
    expect(records[0].date).toBeInstanceOf(Date);
    expect(records[0].description).toContain('SWIGGY');
    expect(records[0].amount).toBe(450);
    expect(records[0].type).toBe('expense');

    expect(records[1].amount).toBe(85000);
    expect(records[1].type).toBe('income');
    expect(records[1].description).toContain('SALARY');
  });

  test('parseExcelBuffer and normalizeRawRecords parses .xlsx statement with debit/credit columns', async () => {
    const data = [
      { 'Txn Date': '2025-08-10', 'Narration': 'AMAZON PAY INDIA', 'Debit Amount': 1299.00, 'Credit Amount': 0 },
      { 'Txn Date': '2025-08-11', 'Narration': 'ELECTRICITY BESCOM', 'Debit Amount': 2100.50, 'Credit Amount': 0 }
    ];

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Statement');
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const rawRows = await parseExcelBuffer(excelBuffer);
    const records = normalizeRawRecords(rawRows);

    expect(records).toHaveLength(2);
    expect(records[0].amount).toBe(1299);
    expect(records[0].type).toBe('expense');
    expect(records[1].description).toContain('BESCOM');
  });

  test('normalizeRawRecords filters empty records gracefully', async () => {
    const records = normalizeRawRecords([]);
    expect(records).toEqual([]);
  });
});

describe('Phase 1: Transaction Intelligence & Rule Heuristics Tests', () => {
  test('extractMerchantAndCategory identifies Food category from Swiggy/Zomato narrations', () => {
    const res1 = extractMerchantAndCategory('UPI/SWIGGY/12345/BANGALORE');
    expect(res1.merchant).toBe('Swiggy');
    expect(res1.category).toBe('Food');
    expect(res1.confidence).toBeGreaterThanOrEqual(0.9);

    const res2 = extractMerchantAndCategory('POS ZOMATO RESTAURANT 9982');
    expect(res2.merchant).toBe('Zomato');
    expect(res2.category).toBe('Food');
  });

  test('extractMerchantAndCategory identifies Transport from Uber/Ola/Metro', () => {
    const res = extractMerchantAndCategory('UBER TRIP 981273 BANGALORE');
    expect(res.merchant).toBe('Cab Service');
    expect(res.category).toBe('Transport');
    expect(res.confidence).toBeGreaterThanOrEqual(0.85);
  });

  test('extractMerchantAndCategory identifies Salary on payroll narrations', () => {
    const res = extractMerchantAndCategory('NEFT CR-INFOSYS TECHNOLOGIES-SALARY AUG 2025');
    expect(res.category).toBe('Salary');
    expect(res.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test('extractMerchantAndCategory falls back to Other for unknown narration', () => {
    const res = extractMerchantAndCategory('MISCELLANEOUS UNKNOWN TXN 999');
    expect(res.category).toBe('Other');
    expect(res.confidence).toBeLessThan(0.7);
  });

  test('generateFingerprint creates deterministic SHA-256 hash', () => {
    const fp1 = generateFingerprint({
      userId: '60d0fe4f5311236168a109ca',
      date: new Date('2025-08-15T00:00:00.000Z'),
      amount: 450,
      merchant: 'SWIGGY',
      reference: 'UPI123',
      type: 'expense'
    });

    const fp2 = generateFingerprint({
      userId: '60d0fe4f5311236168a109ca',
      date: new Date('2025-08-15T00:00:00.000Z'),
      amount: 450,
      merchant: 'SWIGGY',
      reference: 'UPI123',
      type: 'expense'
    });

    const fp3 = generateFingerprint({
      userId: '60d0fe4f5311236168a109cb', // different user
      date: new Date('2025-08-15T00:00:00.000Z'),
      amount: 450,
      merchant: 'SWIGGY',
      reference: 'UPI123',
      type: 'expense'
    });

    expect(fp1).toBe(fp2);
    expect(fp1).not.toBe(fp3);
    expect(typeof fp1).toBe('string');
    expect(fp1.length).toBe(64);
  });

  test('detectDuplicate flags existing matching transaction', () => {
    const existing = [
      {
        fingerprint: 'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
        amount: 500,
        date: new Date('2025-08-15')
      }
    ];

    const isDup = detectDuplicate(
      'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
      existing
    );
    expect(isDup).toBe(true);

    const notDup = detectDuplicate('otherhash', existing);
    expect(notDup).toBe(false);
  });

  test('enrichTransactions calculates confidence scores, merchants, and fingerprints', async () => {
    const rawTxns = [
      {
        title: 'Swiggy order',
        description: 'UPI/SWIGGY/12345/DELHI',
        amount: 450,
        date: new Date('2025-08-15'),
        type: 'expense'
      }
    ];

    const enriched = await enrichTransactions(rawTxns, '60d0fe4f5311236168a109ca');
    expect(enriched).toHaveLength(1);
    expect(enriched[0].merchant).toBe('Swiggy');
    expect(enriched[0].category).toBe('Food');
    expect(enriched[0].confidence).toBeGreaterThanOrEqual(0.9);
    expect(enriched[0].fingerprint).toBeDefined();
    expect(enriched[0].isDuplicate).toBe(false);
  });
});

describe('Phase 1: Ingestion API Endpoint & Auth Isolation Security Tests', () => {
  const JWT_SECRET = 'test_jwt_secret_key_1234567890abcdef';

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  test('POST /api/imports/csv rejects unauthorized requests with 401', async () => {
    const res = await request(app).post('/api/imports/csv');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/imports rejects unauthorized requests with 401', async () => {
    const res = await request(app).get('/api/imports');
    expect(res.status).toBe(401);
  });

  test('POST /api/imports/csv returns 400 when no file is uploaded', async () => {
    const token = jwt.sign({ id: '60d0fe4f5311236168a109ca', role: 'user' }, JWT_SECRET, {
      expiresIn: '1h'
    });

    const res = await request(app)
      .post('/api/imports/csv')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/file to upload/i);
  });

  test('POST /api/imports/excel returns 400 when no file is uploaded', async () => {
    const token = jwt.sign({ id: '60d0fe4f5311236168a109ca', role: 'user' }, JWT_SECRET, {
      expiresIn: '1h'
    });

    const res = await request(app)
      .post('/api/imports/excel')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/file to upload/i);
  });
});

