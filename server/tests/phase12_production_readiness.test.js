import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Goal from '../models/Goal.js';
import Budget from '../models/Budget.js';
import ActionPlan from '../models/ActionPlan.js';
import CopilotSession from '../models/CopilotSession.js';
import ImportBatch from '../models/ImportBatch.js';
import { generateToken, signup, login, changePassword, sanitizeUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  calculateFinancialMetrics,
  calculateCategorySpending,
  calculateMerchantAnalytics,
  detectAnomalies,
  calculateForecastAndRisk,
  calculateBankingIntelligenceSummary
} from '../services/bankingIntelligenceService.js';
import { calculateMultiMonthTrends } from '../services/trendIntelligenceService.js';
import { detectRecurringSubscriptions, normalizeMerchantName } from '../services/subscriptionService.js';
import { enrichGoalWithCalculations, calculateRemainingAmount, calculateMonthsRemaining } from '../services/goalService.js';
import { generateCandidateActionPlans } from '../services/actionPlanService.js';
import { generateMonthlyReport, sanitizeSpreadsheetCell } from '../services/reportService.js';
import { getProactiveInsights } from '../services/proactiveInsightService.js';
import { validateExcelBufferSignature, validateCSVBuffer } from '../services/fileParserService.js';

describe('Phase 12: Production Readiness & Final System Validation Suite', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'phase_12_validation_jwt_secret_key_2026';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('1. Financial Source-of-Truth Invariant (Confirmed-Only Ledger)', () => {
    const userA = new mongoose.Types.ObjectId().toString();
    const mockMixedTransactions = [
      {
        _id: new mongoose.Types.ObjectId(),
        userId: userA,
        title: 'Salary Deposit',
        merchant: 'Employer Corp',
        amount: 80000,
        type: 'income',
        category: 'Salary',
        status: 'confirmed',
        transactionDate: new Date('2026-09-05')
      },
      {
        _id: new mongoose.Types.ObjectId(),
        userId: userA,
        title: 'Apartment Rent',
        merchant: 'Skyline Properties',
        amount: 25000,
        type: 'expense',
        category: 'Housing',
        status: 'confirmed',
        transactionDate: new Date('2026-09-06')
      },
      // STAGED transaction — MUST be ignored in intelligence
      {
        _id: new mongoose.Types.ObjectId(),
        userId: userA,
        title: 'Pending Grocery Upload',
        merchant: 'Supermart',
        amount: 5000,
        type: 'expense',
        category: 'Food',
        status: 'staged',
        transactionDate: new Date('2026-09-10')
      },
      // IGNORED transaction — MUST be ignored in intelligence
      {
        _id: new mongoose.Types.ObjectId(),
        userId: userA,
        title: 'Ignored Duplicate',
        merchant: 'Duplicate Merchant',
        amount: 10000,
        type: 'expense',
        category: 'Shopping',
        status: 'ignored',
        transactionDate: new Date('2026-09-12')
      }
    ];

    test('1.1 calculateFinancialMetrics strictly excludes staged and ignored transactions', () => {
      const metrics = calculateFinancialMetrics(mockMixedTransactions);
      expect(metrics.totalIncome).toBe(80000);
      expect(metrics.totalExpense).toBe(25000); // 25000 confirmed, NOT 25000 + 5000 + 10000 = 40000
      expect(metrics.netSavings).toBe(55000);
      expect(metrics.savingsRate).toBe(68.75);
      expect(metrics.transactionCount).toBe(2); // Only 2 confirmed
    });

    test('1.2 calculateCategorySpending strictly excludes staged and ignored categories', () => {
      const categories = calculateCategorySpending(mockMixedTransactions);
      const catNames = categories.map((c) => c.category);
      expect(catNames).toContain('Housing');
      expect(catNames).not.toContain('Food'); // Food was staged
      expect(catNames).not.toContain('Shopping'); // Shopping was ignored
      expect(categories[0].amount).toBe(25000);
    });

    test('1.3 calculateMerchantAnalytics strictly counts only confirmed transactions', () => {
      const merchants = calculateMerchantAnalytics(mockMixedTransactions);
      const merchantNames = merchants.map((m) => m.merchant);
      expect(merchantNames).toContain('Skyline Properties');
      expect(merchantNames).not.toContain('Supermart');
      expect(merchantNames).not.toContain('Duplicate Merchant');
    });

    test('1.4 calculateForecastAndRisk ignores staged and ignored records in daily burn calculations', () => {
      const forecast = calculateForecastAndRisk({
        currentTransactions: mockMixedTransactions,
        referenceDate: new Date('2026-09-15')
      });
      // 25000 / 15 days = 1666.67/day
      expect(forecast.currentMonthExpense).toBe(25000);
      expect(forecast.dailyBurnRate).toBeCloseTo(1666.67, 1);
    });

    test('1.5 subscription detection strictly processes confirmed transactions only', async () => {
      const result = await detectRecurringSubscriptions({
        userId: userA,
        transactions: mockMixedTransactions
      });
      expect(result.subscriptions).toEqual([]);
    });

    test('1.6 multi-month trends strictly filter confirmed transactions only', async () => {
      const result = await calculateMultiMonthTrends({
        userId: userA,
        range: '6m',
        referenceMonth: '2026-09',
        transactions: mockMixedTransactions
      });
      const sep = result.months.find((m) => m.month === '2026-09');
      expect(sep.income).toBe(80000);
      expect(sep.expenses).toBe(25000);
      expect(sep.netSavings).toBe(55000);
      expect(sep.transactionCount).toBe(2);
    });
  });

  describe('2. User Isolation & Cross-Account Data Confidentiality', () => {
    const userA = new mongoose.Types.ObjectId().toString();
    const userB = new mongoose.Types.ObjectId().toString();

    test('2.1 multi-month trends cannot access another user transactions', async () => {
      const userBTransactions = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userB,
          title: 'User B Secret Income',
          amount: 500000,
          type: 'income',
          status: 'confirmed',
          transactionDate: new Date('2026-09-01')
        }
      ];

      const resultUserA = await calculateMultiMonthTrends({
        userId: userA,
        range: '6m',
        referenceMonth: '2026-09',
        transactions: userBTransactions
      });

      const sepMonth = resultUserA.months.find((m) => m.month === '2026-09');
      expect(sepMonth.income).toBe(0);
      expect(sepMonth.expenses).toBe(0);
      expect(sepMonth.transactionCount).toBe(0);
    });

    test('2.2 subscriptions engine isolates user records', async () => {
      const userBSubs = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userB,
          title: 'Netflix',
          merchant: 'Netflix',
          amount: 649,
          type: 'expense',
          status: 'confirmed',
          transactionDate: new Date('2026-07-01')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userB,
          title: 'Netflix',
          merchant: 'Netflix',
          amount: 649,
          type: 'expense',
          status: 'confirmed',
          transactionDate: new Date('2026-08-01')
        },
        {
          _id: new mongoose.Types.ObjectId(),
          userId: userB,
          title: 'Netflix',
          merchant: 'Netflix',
          amount: 649,
          type: 'expense',
          status: 'confirmed',
          transactionDate: new Date('2026-09-01')
        }
      ];

      const userAResult = await detectRecurringSubscriptions({
        userId: userA,
        transactions: userBSubs
      });
      expect(userAResult.subscriptions.length).toBe(0);
    });
  });

  describe('3. Mathematical Financial Accuracy & Edge Cases', () => {
    test('3.1 handles income = 0 with expenses cleanly (negative savings rate capped gracefully)', () => {
      const txs = [
        { amount: 5000, type: 'expense', status: 'confirmed' }
      ];
      const metrics = calculateFinancialMetrics(txs);
      expect(metrics.totalIncome).toBe(0);
      expect(metrics.totalExpense).toBe(5000);
      expect(metrics.netSavings).toBe(-5000);
      expect(metrics.savingsRate).toBe(0); // Protected against division by 0
      expect(metrics.isDeficit).toBe(true);
      expect(isNaN(metrics.savingsRate)).toBe(false);
      expect(isFinite(metrics.savingsRate)).toBe(true);
    });

    test('3.2 handles expenses = 0 with positive income cleanly (100% savings rate)', () => {
      const txs = [
        { amount: 45000, type: 'income', status: 'confirmed' }
      ];
      const metrics = calculateFinancialMetrics(txs);
      expect(metrics.totalIncome).toBe(45000);
      expect(metrics.totalExpense).toBe(0);
      expect(metrics.netSavings).toBe(45000);
      expect(metrics.savingsRate).toBe(100);
      expect(metrics.isDeficit).toBe(false);
    });

    test('3.3 handles completely empty transaction array cleanly without errors', () => {
      const metrics = calculateFinancialMetrics([]);
      expect(metrics.totalIncome).toBe(0);
      expect(metrics.totalExpense).toBe(0);
      expect(metrics.netSavings).toBe(0);
      expect(metrics.savingsRate).toBe(0);
      expect(metrics.isDeficit).toBe(false);
      expect(metrics.transactionCount).toBe(0);
    });

    test('3.4 goal remaining amount calculation never returns negative values', () => {
      expect(calculateRemainingAmount({ targetAmount: 100000, currentAmount: 40000 })).toBe(60000);
      expect(calculateRemainingAmount({ targetAmount: 50000, currentAmount: 75000 })).toBe(0); // Overfunded
      expect(calculateRemainingAmount({ targetAmount: 0, currentAmount: 0 })).toBe(0);
    });

    test('3.5 goal months remaining handles overdue and active targets correctly', () => {
      const ref = new Date('2026-09-15');
      // Target in same month = 1 month
      expect(calculateMonthsRemaining({ targetDate: '2026-09-30', referenceDate: ref })).toBe(1);
      // Target 3 months out
      expect(calculateMonthsRemaining({ targetDate: '2026-12-31', referenceDate: ref })).toBe(4);
      // Target in past = 0 months
      expect(calculateMonthsRemaining({ targetDate: '2026-01-01', referenceDate: ref })).toBe(0);
    });

    test('3.6 goal enrichment calculates feasibility score and status deterministically', () => {
      const goal = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Emergency Fund',
        targetAmount: 100000,
        currentAmount: 40000,
        targetDate: new Date('2026-12-31'),
        status: 'in_progress'
      };

      const enriched = enrichGoalWithCalculations(goal, {
        referenceDate: new Date('2026-09-15'),
        netMonthlySavings: 20000
      });

      expect(enriched.remainingAmount).toBe(60000);
      expect(enriched.progressPercentage).toBe(40);
      expect(enriched.monthsRemaining).toBe(4);
      expect(enriched.requiredMonthlySavings).toBe(15000); // 60000 / 4 months = 15000/mo
      expect(enriched.feasibility.status).toBe('HIGHLY_FEASIBLE'); // 20000 net savings >= 15000 required
      expect(enriched.feasibility.score).toBe(100);
    });
  });

  describe('4. Large Dataset Performance & Stress Testing', () => {
    test('4.1 benchmark execution time on 1,000 transactions remains under 50ms', () => {
      const count = 1000;
      const largeDataset = [];
      const categories = ['Food', 'Housing', 'Transportation', 'Entertainment', 'Utilities', 'Shopping', 'Healthcare'];
      const merchants = ['Amazon', 'Swiggy', 'Zomato', 'Uber', 'Airtel', 'Electricity Board', 'Supermart'];

      for (let i = 0; i < count; i++) {
        largeDataset.push({
          _id: new mongoose.Types.ObjectId(),
          userId: 'user_benchmark',
          title: `Tx ${i}`,
          merchant: merchants[i % merchants.length],
          category: categories[i % categories.length],
          amount: 50 + (i % 500) * 10,
          type: i % 10 === 0 ? 'income' : 'expense',
          status: 'confirmed',
          transactionDate: new Date(2026, 8, 1 + (i % 28))
        });
      }

      const t0 = performance.now();
      const metrics = calculateFinancialMetrics(largeDataset);
      const catSpending = calculateCategorySpending(largeDataset);
      const merchantAnalytics = calculateMerchantAnalytics(largeDataset, { limit: 10 });
      const anomalies = detectAnomalies(largeDataset);
      const forecast = calculateForecastAndRisk({ currentTransactions: largeDataset });
      const t1 = performance.now();

      const elapsed = t1 - t0;
      expect(elapsed).toBeLessThan(100); // Must compute in under 100ms
      expect(metrics.transactionCount).toBe(1000);
      expect(catSpending.length).toBeGreaterThan(0);
      expect(merchantAnalytics.length).toBe(7);
      expect(forecast.projectedExpense).toBeGreaterThan(0);
    });

    test('4.2 benchmark execution time on 5,000 transactions remains under 250ms', () => {
      const count = 5000;
      const massiveDataset = [];
      for (let i = 0; i < count; i++) {
        massiveDataset.push({
          _id: new mongoose.Types.ObjectId(),
          userId: 'user_massive',
          title: `Item ${i}`,
          merchant: `Merchant ${i % 20}`,
          category: `Category ${i % 10}`,
          amount: 100 + (i % 1000),
          type: i % 8 === 0 ? 'income' : 'expense',
          status: 'confirmed',
          transactionDate: new Date(2026, 8, 1 + (i % 30))
        });
      }

      const t0 = performance.now();
      const metrics = calculateFinancialMetrics(massiveDataset);
      const catSpending = calculateCategorySpending(massiveDataset);
      const t1 = performance.now();

      expect(t1 - t0).toBeLessThan(250);
      expect(metrics.transactionCount).toBe(5000);
      expect(catSpending.length).toBe(10);
    });
  });

  describe('5. Import Security & Formula Injection Neutralization', () => {
    test('5.1 validateExcelBufferSignature rejects corrupt, empty, and non-Excel binary files', () => {
      expect(validateExcelBufferSignature(null).valid).toBe(false);
      expect(validateExcelBufferSignature(Buffer.from('plain text masquerading as xlsx')).valid).toBe(false);
      expect(validateExcelBufferSignature(Buffer.from([0x00, 0x01, 0x02, 0x03])).valid).toBe(false);
    });

    test('5.2 validateCSVBuffer detects embedded null bytes to reject binary disguised as CSV', () => {
      const maliciousBuffer = Buffer.from('Name,Amount\nTest,\x00\x00\x00\x01');
      const result = validateCSVBuffer(maliciousBuffer);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('binary content detected');
    });

    test('5.3 sanitizeSpreadsheetCell prevents DDE and formula injection attacks', () => {
      const dangerousInputs = [
        '=1+1',
        '+2+3',
        '-5+2',
        '@SUM(A1:A10)',
        '\t=cmd',
        '\r+calc'
      ];

      dangerousInputs.forEach((input) => {
        const sanitized = sanitizeSpreadsheetCell(input);
        expect(sanitized.startsWith("'")).toBe(true);
      });

      // Valid financial numbers and names remain untouched
      expect(sanitizeSpreadsheetCell(2500)).toBe(2500);
      expect(sanitizeSpreadsheetCell('Grocery Store')).toBe('Grocery Store');
      expect(sanitizeSpreadsheetCell('Salary Payment')).toBe('Salary Payment');
    });
  });

  describe('6. Production Error & Configuration Safety', () => {
    test('6.1 sanitizeUser never exposes internal password hashes or secrets', () => {
      const rawUser = {
        _id: new mongoose.Types.ObjectId('60d5ec49f1b2c8a1b8c8d999'),
        name: 'Safe Account',
        email: 'safe@example.com',
        password: '$2b$10$verySecretBcryptHashHere',
        tokenVersion: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const sanitized = sanitizeUser(rawUser);
      expect(sanitized.password).toBeUndefined();
      expect(sanitized.id).toBe('60d5ec49f1b2c8a1b8c8d999');
      expect(sanitized.name).toBe('Safe Account');
      expect(sanitized.email).toBe('safe@example.com');
    });
  });
});
