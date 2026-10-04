/**
 * Mock DB Preload for FinTrack Live MCP stdio Subprocess Validation
 * Intercepts Mongoose models for standalone isolated execution.
 */

import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';

const userAId = '6ab7c32e420b3243f6ab9fd1';
const userBId = '6ab7c32e420b3243f6ab9fd2';

const mockTransactions = [
  // User A Confirmed
  {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(userAId),
    type: 'income',
    title: 'Tech Salary',
    merchant: 'Tech Corp',
    amount: 80000,
    category: 'Salary',
    status: 'confirmed',
    transactionDate: new Date('2026-03-01')
  },
  {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(userAId),
    type: 'expense',
    title: 'Apartment Rent',
    merchant: 'Landlord',
    amount: 25000,
    category: 'Rent',
    status: 'confirmed',
    transactionDate: new Date('2026-03-02')
  },
  {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(userAId),
    type: 'expense',
    title: 'Grocery Mart',
    merchant: 'DMart',
    amount: 5000,
    category: 'Food',
    status: 'confirmed',
    transactionDate: new Date('2026-03-05')
  },
  // User A Staged (must be excluded from confirmed tools)
  {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(userAId),
    type: 'expense',
    title: 'Pending SMS Draft',
    merchant: 'Staged Merchant',
    amount: 99999,
    category: 'Other',
    status: 'staged',
    transactionDate: new Date('2026-03-06')
  },
  // User A Ignored (must be excluded from confirmed tools)
  {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(userAId),
    type: 'expense',
    title: 'Ignored Promo',
    merchant: 'Ignored Merchant',
    amount: 88888,
    category: 'Other',
    status: 'ignored',
    transactionDate: new Date('2026-03-07')
  },
  // User B Confirmed
  {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(userBId),
    type: 'income',
    title: 'Design Fee',
    merchant: 'Agency',
    amount: 60000,
    category: 'Salary',
    status: 'confirmed',
    transactionDate: new Date('2026-03-01')
  },
  {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(userBId),
    type: 'expense',
    title: 'Camera Equipment',
    merchant: 'Sony Store',
    amount: 15000,
    category: 'Shopping',
    status: 'confirmed',
    transactionDate: new Date('2026-03-03')
  }
];

const mockBudgets = [
  {
    userId: new mongoose.Types.ObjectId(userAId),
    monthlyBudget: 40000,
    categoryBudgets: [
      { category: 'Food', limit: 8000 },
      { category: 'Rent', limit: 30000 }
    ]
  },
  {
    userId: new mongoose.Types.ObjectId(userBId),
    monthlyBudget: 30000,
    categoryBudgets: [
      { category: 'Shopping', limit: 20000 }
    ]
  }
];

const mockGoals = [
  {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(userAId),
    title: 'Emergency Fund',
    targetAmount: 100000,
    currentAmount: 50000,
    targetDate: new Date('2026-12-31'),
    status: 'in_progress',
    category: 'Emergency'
  }
];

// Set mongoose connection readyState to 1 (connected)
mongoose.connection.readyState = 1;
mongoose.connect = async () => mongoose.connection;

Transaction.find = (query = {}) => {
  const filtered = mockTransactions.filter((t) => {
    if (query.userId && t.userId.toString() !== query.userId.toString()) return false;
    if (query.status && t.status !== query.status) return false;
    if (query.transactionDate?.$gte && t.transactionDate < query.transactionDate.$gte) return false;
    if (query.transactionDate?.$lte && t.transactionDate > query.transactionDate.$lte) return false;
    if (query.transactionDate?.$lt && t.transactionDate >= query.transactionDate.$lt) return false;
    return true;
  });
  return {
    sort: () => Promise.resolve(filtered),
    then: (resolve) => resolve(filtered)
  };
};

Budget.findOne = (query = {}) => {
  const found = mockBudgets.find((b) => query.userId && b.userId.toString() === query.userId.toString());
  return Promise.resolve(found || null);
};

Goal.find = (query = {}) => {
  const filtered = mockGoals.filter((g) => {
    if (query.userId && g.userId.toString() !== query.userId.toString()) return false;
    return true;
  });
  return {
    sort: () => Promise.resolve(filtered),
    then: (resolve) => resolve(filtered)
  };
};

console.error('[MockDbPreload] Intercepted Mongoose models with isolated test datasets for MCP subprocess.');
