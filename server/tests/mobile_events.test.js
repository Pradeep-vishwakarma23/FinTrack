import request from 'supertest';
import app from '../app.js';
import jwt from 'jsonwebtoken';

describe('Phase 5: Mobile Notification Ingestion API & Security Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_1234567890abcdef';
  const userIdA = '60d0fe4f5311236168a109ca';
  const userIdB = '60d0fe4f5311236168a109cb';

  let tokenA;
  let tokenB;

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    tokenA = jwt.sign({ id: userIdA, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign({ id: userIdB, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
  });

  test('POST /api/mobile/events rejects unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post('/api/mobile/events')
      .send({
        merchant: 'Swiggy',
        amount: 480,
        type: 'expense',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/mobile/events/stats rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/mobile/events/stats');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/mobile/events rejects sensitive OTP or security payload with 400', async () => {
    const res = await request(app)
      .post('/api/mobile/events')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        merchant: 'Bank Alert',
        title: 'Your OTP is 482910 to verify transaction',
        amount: 500,
        description: 'OTP 482910',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/sensitive|security/i);
  });

  test('POST /api/mobile/events rejects invalid or negative amount with 400', async () => {
    const res = await request(app)
      .post('/api/mobile/events')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        merchant: 'Amazon',
        amount: -50,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/amount/i);
  });

  test('POST /api/mobile/events successfully stages sanitized financial notification event', async () => {
    const res = await request(app)
      .post('/api/mobile/events')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        merchant: 'Swiggy Bangalore',
        amount: 480,
        type: 'expense',
        packageName: 'com.google.android.apps.nbu.paisa.user',
        appName: 'Google Pay',
        description: 'Paid ₹480 to Swiggy via UPI',
        sourceReference: 'UPI/492019283',
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(res.body.stagedTransaction).toBeDefined();
    expect(res.body.stagedTransaction.status).toBe('staged');
    expect(res.body.stagedTransaction.source).toBe('notification');
    expect(res.body.stagedTransaction.category).toBe('Food');
    expect(res.body.stagedTransaction.amount).toBe(480);
    expect(res.body.stagedTransaction.fingerprint).toBeDefined();
  });

  test('POST /api/mobile/events flags duplicate notification events and stages them for review', async () => {
    const payload = {
      merchant: 'Uber India Rides',
      amount: 320.50,
      type: 'expense',
      packageName: 'com.phonepe.app',
      appName: 'PhonePe',
      description: 'Paid Rs 320.50 for Uber ride',
      sourceReference: 'PHONEPE_UBER_123',
      transactionDate: '2026-09-26T14:00:00.000Z',
    };

    // First ingestion -> isDuplicate: false, status: 'staged'
    const res1 = await request(app)
      .post('/api/mobile/events')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(payload);

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    expect(res1.body.isDuplicate).toBe(false);
    expect(res1.body.stagedTransaction).toBeDefined();
    expect(res1.body.stagedTransaction.status).toBe('staged');
    expect(res1.body.stagedTransaction.isDuplicate).toBe(false);

    // Second ingestion with identical payload -> isDuplicate: true, status: 'staged'
    const res2 = await request(app)
      .post('/api/mobile/events')
      .set('Authorization', `Bearer ${tokenA}`)
      .send(payload);

    expect(res2.status).toBe(201);
    expect(res2.body.success).toBe(true);
    expect(res2.body.isDuplicate).toBe(true);
    expect(res2.body.stagedTransaction).toBeDefined();
    expect(res2.body.stagedTransaction.status).toBe('staged');
    expect(res2.body.stagedTransaction.isDuplicate).toBe(true);
    expect(res2.body.stagedTransaction.fingerprint).toBe(res1.body.stagedTransaction.fingerprint);
  });

  test('GET /api/mobile/events/stats returns user isolated notification metrics including duplicate counts', async () => {
    const resA = await request(app)
      .get('/api/mobile/events/stats')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(resA.status).toBe(200);
    expect(resA.body.success).toBe(true);
    expect(resA.body.stats).toBeDefined();
    expect(resA.body.stats.serviceStatus).toBe('active');
    expect(resA.body.stats.totalEvents).toBeGreaterThanOrEqual(2);
    expect(resA.body.stats.duplicatesCount).toBeGreaterThanOrEqual(1);

    // User B stats should be isolated
    const resB = await request(app)
      .get('/api/mobile/events/stats')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resB.status).toBe(200);
    expect(resB.body.success).toBe(true);
    expect(resB.body.stats).toBeDefined();
  });
});
