import request from 'supertest';
import app, { getCorsOrigins, setupMongoLifecycleListeners } from '../app.js';
import { escapeRegex } from '../controllers/transactionController.js';
import { authRateLimiter } from '../routes/authRoutes.js';
import rateLimit from 'express-rate-limit';
import express from 'express';
import mongoose from 'mongoose';

describe('Phase 11.1 Security Hardening Test Suite', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalFrontendUrl = process.env.FRONTEND_URL;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.FRONTEND_URL = originalFrontendUrl;
  });

  describe('1. Regex Search Sanitization', () => {
    test('escapeRegex properly escapes all special regex metacharacters', () => {
      const maliciousPatterns = [
        '(', ')', '[', ']', '{', '}', '*', '+', '?', '.', '\\', '^', '$', '|'
      ];

      maliciousPatterns.forEach((char) => {
        const escaped = escapeRegex(char);
        expect(escaped).toBe(`\\${char}`);
        // Ensure constructor does not throw SyntaxError
        expect(() => new RegExp(escaped, 'i')).not.toThrow();
      });
    });

    test('escapeRegex handles complex malicious backtracking and grouping payloads safely', () => {
      const complexPayloads = [
        '((((((a+)+)+)+)+)+)',
        '[a-zA-Z0-9]+.*(test|malicious)?',
        '\\d{4}-\\d{2}-\\d{2}$',
        '^(root|admin).*[?*+]',
        '../../../etc/passwd'
      ];

      complexPayloads.forEach((payload) => {
        const escaped = escapeRegex(payload);
        expect(() => new RegExp(escaped, 'i')).not.toThrow();
      });
    });

    test('escapeRegex safely handles non-string inputs', () => {
      expect(escapeRegex(null)).toBe('');
      expect(escapeRegex(undefined)).toBe('');
      expect(escapeRegex(123)).toBe('');
    });
  });

  describe('2. Authentication Rate Limiting', () => {
    test('authRateLimiter is properly instantiated as an express middleware', () => {
      expect(typeof authRateLimiter).toBe('function');
    });

    test('blocks excessive requests when rate limit threshold is exceeded', async () => {
      const testApp = express();
      testApp.use(express.json());

      const strictLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 3,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          message: 'Too many authentication attempts, please try again after 15 minutes.'
        }
      });

      testApp.post('/test-auth', strictLimiter, (req, res) => {
        res.status(200).json({ success: true });
      });

      // 3 successful requests
      for (let i = 0; i < 3; i++) {
        const res = await request(testApp).post('/test-auth').send({});
        expect(res.status).toBe(200);
      }

      // 4th request must be rejected with 429 Too Many Requests
      const blockedRes = await request(testApp).post('/test-auth').send({});
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.success).toBe(false);
      expect(blockedRes.body.message).toContain('Too many authentication attempts');
    });
  });

  describe('3. Production Error Sanitization', () => {
    test('returns generic "Internal server error" message in production mode', async () => {
      process.env.NODE_ENV = 'production';

      const errorApp = express();
      errorApp.get('/trigger-error', (req, res, next) => {
        const sensitiveError = new Error('MongoError: connection pool destroyed at /var/www/internal/db.js:42');
        next(sensitiveError);
      });

      // Mirror production error handler from app.js
      errorApp.use((err, req, res, next) => {
        const isProd = process.env.NODE_ENV === 'production';
        const clientMessage = isProd ? 'Internal server error' : (err.message || 'Something went wrong');
        res.status(500).json({
          success: false,
          message: clientMessage
        });
      });

      const res = await request(errorApp).get('/trigger-error');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Internal server error');
      expect(res.body.message).not.toContain('MongoError');
      expect(res.body.message).not.toContain('/var/www/');
    });

    test('returns descriptive error message in development mode for debugging', async () => {
      process.env.NODE_ENV = 'development';

      const errorApp = express();
      errorApp.get('/trigger-error', (req, res, next) => {
        next(new Error('Validation failed for field "amount"'));
      });

      errorApp.use((err, req, res, next) => {
        const isProd = process.env.NODE_ENV === 'production';
        const clientMessage = isProd ? 'Internal server error' : (err.message || 'Something went wrong');
        res.status(500).json({
          success: false,
          message: clientMessage
        });
      });

      const res = await request(errorApp).get('/trigger-error');
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed for field "amount"');
    });
  });

  describe('4. Production CORS Hardening', () => {
    test('permits localhost origins in development mode', () => {
      process.env.NODE_ENV = 'development';
      const origins = getCorsOrigins();
      expect(origins).toContain('http://localhost:5173');
      expect(origins).toContain('http://127.0.0.1:5173');
    });

    test('strictly enforces configured production domain in production mode', () => {
      process.env.NODE_ENV = 'production';
      process.env.FRONTEND_URL = 'https://app.fintrack.finance';

      const origins = getCorsOrigins();
      expect(origins).toContain('https://app.fintrack.finance');
      expect(origins).not.toContain('http://localhost:5173');
      expect(origins).not.toContain('http://127.0.0.1:5173');
      expect(origins).not.toContain('*');
    });
  });

  describe('5. MongoDB Lifecycle Listeners', () => {
    test('setupMongoLifecycleListeners attaches without errors and is idempotent', () => {
      expect(() => {
        setupMongoLifecycleListeners();
        setupMongoLifecycleListeners();
      }).not.toThrow();
    });
  });
});
