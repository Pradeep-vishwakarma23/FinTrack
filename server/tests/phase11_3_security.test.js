import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import User from '../models/User.js';
import { generateToken, signup, changePassword, sanitizeUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  validateExcelBufferSignature,
  validateCSVBuffer
} from '../services/fileParserService.js';
import { sanitizeSpreadsheetCell } from '../services/reportService.js';

describe('Phase 11.3: Advanced Security Implementation Test Suite', () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_phase_11_3_hardening';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  describe('1. JWT Token Invalidation (tokenVersion)', () => {
    test('1.1 User model schema defaults tokenVersion to 0', () => {
      const user = new User({
        name: 'Jane Doe',
        email: 'janedoe@example.com',
        password: 'Password123'
      });
      expect(user.tokenVersion).toBe(0);
    });

    test('1.2 generateToken includes id and tokenVersion in JWT payload', () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId('60d5ec49f1b2c8a1b8c8d111'),
        tokenVersion: 2
      };
      const token = generateToken(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.id).toBe(mockUser._id.toString());
      expect(decoded.tokenVersion).toBe(2);
    });

    test('1.3 generateToken supports overloaded userOrId signature with default tokenVersion', () => {
      const userId = new mongoose.Types.ObjectId('60d5ec49f1b2c8a1b8c8d222').toString();
      const token = generateToken(userId, 3);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.id).toBe(userId);
      expect(decoded.tokenVersion).toBe(3);
    });

    test('1.4 authMiddleware protect accepts valid matching tokenVersion', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const token = generateToken({ _id: userId, tokenVersion: 1 });

      const testApp = express();
      testApp.use(express.json());

      // Mock User.findById
      const spyFindById = jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: userId, tokenVersion: 1 })
      });

      // Temporarily mock readyState
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

      testApp.get('/api/test-protected', protect, (req, res) => {
        res.status(200).json({ success: true, userId: req.userId });
      });

      const res = await request(testApp)
        .get('/api/test-protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.userId).toBe(userId);

      spyFindById.mockRestore();
      Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    });

    test('1.5 authMiddleware protect rejects mismatched tokenVersion (invalidated token)', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      // Token issued with tokenVersion: 0
      const oldToken = generateToken({ _id: userId, tokenVersion: 0 });

      const testApp = express();
      testApp.use(express.json());

      // User document in DB now has tokenVersion: 1 (after password change or security reset)
      const spyFindById = jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: userId, tokenVersion: 1 })
      });

      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

      testApp.get('/api/test-protected', protect, (req, res) => {
        res.status(200).json({ success: true, userId: req.userId });
      });

      const res = await request(testApp)
        .get('/api/test-protected')
        .set('Authorization', `Bearer ${oldToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not authorized to access this route');

      spyFindById.mockRestore();
      Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    });

    test('1.6 newly issued token with updated tokenVersion works after version increment', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      // New token issued with tokenVersion: 1
      const newToken = generateToken({ _id: userId, tokenVersion: 1 });

      const testApp = express();
      testApp.use(express.json());

      const spyFindById = jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: userId, tokenVersion: 1 })
      });

      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true });

      testApp.get('/api/test-protected', protect, (req, res) => {
        res.status(200).json({ success: true, userId: req.userId });
      });

      const res = await request(testApp)
        .get('/api/test-protected')
        .set('Authorization', `Bearer ${newToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      spyFindById.mockRestore();
      Object.defineProperty(mongoose.connection, 'readyState', { value: originalReadyState, configurable: true });
    });
  });

  describe('2. Password Security Policy (8+ Characters)', () => {
    test('2.1 signup rejects password shorter than 8 characters', async () => {
      const req = {
        body: {
          name: 'Security Test',
          email: 'shortpass@example.com',
          password: 'short12' // 7 characters
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Password must be at least 8 characters'
        })
      );
    });

    test('2.2 signup accepts valid 8+ character password', async () => {
      const mockCreatedUser = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Valid User',
        email: 'validpass@example.com',
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const spyFindOne = jest.spyOn(User, 'findOne').mockResolvedValue(null);
      const spyCreate = jest.spyOn(User, 'create').mockResolvedValue(mockCreatedUser);

      const req = {
        body: {
          name: 'Valid User',
          email: 'validpass@example.com',
          password: 'ValidPassword123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await signup(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String)
        })
      );

      spyFindOne.mockRestore();
      spyCreate.mockRestore();
    });

    test('2.3 changePassword rejects new passwords shorter than 8 characters', async () => {
      const req = {
        userId: new mongoose.Types.ObjectId().toString(),
        body: {
          currentPassword: 'OldPassword123',
          newPassword: 'pass123' // 7 chars
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    });

    test('2.4 changePassword increments tokenVersion and hashes new password', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        tokenVersion: 0,
        password: 'hashed_old_password',
        matchPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      const spyFindById = jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const req = {
        userId: mockUser._id.toString(),
        body: {
          currentPassword: 'CurrentPassword123',
          newPassword: 'NewSecurePassword888'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockUser.tokenVersion).toBe(1);
      expect(mockUser.password).toBe('NewSecurePassword888');
      expect(mockUser.save).toHaveBeenCalled();

      spyFindById.mockRestore();
    });

    test('2.5 sanitizeUser never exposes password or internal cryptographic secrets', () => {
      const user = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Safe User',
        email: 'safe@example.com',
        password: '$2b$10$e8wF8w3rW9eJ.secretHash',
        tokenVersion: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const sanitized = sanitizeUser(user);
      expect(sanitized.password).toBeUndefined();
      expect(sanitized._id).toBeUndefined();
      expect(sanitized.id).toBeDefined();
      expect(sanitized.name).toBe('Safe User');
      expect(sanitized.email).toBe('safe@example.com');
    });
  });

  describe('3. File Upload Security & Signature Validation', () => {
    test('3.1 validateExcelBufferSignature accepts valid ZIP XLSX header PK\\x03\\x04', () => {
      // Standard ZIP header: 0x50 0x4B 0x03 0x04
      const zipBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
      const result = validateExcelBufferSignature(zipBuffer);
      expect(result.valid).toBe(true);
    });

    test('3.2 validateExcelBufferSignature accepts legacy OLE2 XLS header', () => {
      // OLE2 Compound Doc header: 0xD0 0xCF 0x11 0xE0
      const oleBuffer = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
      const result = validateExcelBufferSignature(oleBuffer);
      expect(result.valid).toBe(true);
    });

    test('3.3 validateExcelBufferSignature rejects fake XLSX extension with plaintext or binary mismatch', () => {
      const fakeBuffer = Buffer.from('This is a text file masquerading as an .xlsx spreadsheet');
      const result = validateExcelBufferSignature(fakeBuffer);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid Excel file signature');
    });

    test('3.4 validateExcelBufferSignature safely handles empty/corrupt buffers', () => {
      expect(validateExcelBufferSignature(null).valid).toBe(false);
      expect(validateExcelBufferSignature(Buffer.alloc(0)).valid).toBe(false);
      expect(validateExcelBufferSignature(Buffer.from([0x50, 0x4b])).valid).toBe(false);
    });

    test('3.5 validateCSVBuffer accepts legitimate UTF-8 CSV text content', () => {
      const validCsv = Buffer.from('Date,Description,Amount,Type\n2026-09-01,Salary,50000,income\n2026-09-02,Groceries,2500,expense\n');
      const result = validateCSVBuffer(validCsv);
      expect(result.valid).toBe(true);
    });

    test('3.6 validateCSVBuffer rejects binary payloads masquerading as CSV', () => {
      // Buffer containing null bytes (binary/executable header)
      const binaryBuffer = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00]);
      const result = validateCSVBuffer(binaryBuffer);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('binary content detected');
    });
  });

  describe('4. Spreadsheet Formula-Injection (CSV Injection) Protection', () => {
    test('4.1 sanitizeSpreadsheetCell neutralizes formula prefixes (=, +, -, @, \\t, \\r)', () => {
      const injectionAttacks = [
        '=cmd|\'/C calc\'!A0',
        '+SUM(1+1)*cmd|',
        '-2+3+cmd|\' /C calc\'!A0',
        '@SUM(1,9)',
        '\t=2+5',
        '\r=10+20'
      ];

      injectionAttacks.forEach((payload) => {
        const sanitized = sanitizeSpreadsheetCell(payload);
        expect(sanitized.startsWith("'")).toBe(true);
        expect(sanitized).toBe(`'${payload}`);
      });
    });

    test('4.2 sanitizeSpreadsheetCell preserves clean numbers and safe text without modification', () => {
      expect(sanitizeSpreadsheetCell(1500)).toBe(1500);
      expect(sanitizeSpreadsheetCell(-50.5)).toBe(-50.5);
      expect(sanitizeSpreadsheetCell(true)).toBe(true);
      expect(sanitizeSpreadsheetCell('Grocery Store')).toBe('Grocery Store');
      expect(sanitizeSpreadsheetCell('Amazon India')).toBe('Amazon India');
      expect(sanitizeSpreadsheetCell('')).toBe('');
      expect(sanitizeSpreadsheetCell(null)).toBe('');
      expect(sanitizeSpreadsheetCell(undefined)).toBe('');
    });
  });
});
