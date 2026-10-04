import request from 'supertest';
import app from '../app.js';
import jwt from 'jsonwebtoken';

describe('Authentication & Security Layer API Tests', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_jwt_secret_key_1234567890abcdef';
  });

  test('GET /health returns server status 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'Server is running' });
  });

  test('Protected routes reject requests without Authorization header with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Not authorized to access this route');
  });

  test('Protected routes reject requests with invalid JWT token with 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.payload');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Not authorized to access this route');
  });

  test('POST /api/auth/signup validates missing required fields with 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Test User' }); // missing email and password

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login validates missing credentials with 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
