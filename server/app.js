import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import importRoutes from './routes/importRoutes.js';
import mobileRoutes from './routes/mobileRoutes.js';
import intelligenceRoutes from './routes/intelligenceRoutes.js';
import aiAdvisorRoutes from './routes/aiAdvisorRoutes.js';
import copilotRoutes from './routes/copilotRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import actionPlanRoutes from './routes/actionPlanRoutes.js';

dotenv.config();

const app = express();

const devAllowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:3000'
];

/**
 * Returns allowed CORS origins based on runtime environment.
 * Development permits localhost suites; Production strictly requires configured domain.
 */
export const getCorsOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    const prodOrigins = [];
    if (process.env.FRONTEND_URL) {
      prodOrigins.push(process.env.FRONTEND_URL);
    }
    if (process.env.ADDITIONAL_ALLOWED_ORIGINS) {
      const extras = process.env.ADDITIONAL_ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
      prodOrigins.push(...extras);
    }
    return prodOrigins.length > 0 ? prodOrigins : [process.env.FRONTEND_URL || 'https://fintrack.app'];
  }
  return devAllowedOrigins;
};

// Middleware
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    const allowed = getCorsOrigins();
    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let isDbLifecycleAttached = false;

/**
 * Attaches Mongoose connection lifecycle listeners for production observability
 */
export const setupMongoLifecycleListeners = () => {
  if (isDbLifecycleAttached) return;
  isDbLifecycleAttached = true;

  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] Connection established successfully');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Connection lost / disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err.message);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Reconnected to database cluster');
  });
};

export const connectDB = async () => {
  setupMongoLifecycleListeners();
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-finance-tracker';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.warn('MongoDB connection failed:', err.message);
    console.warn('Continuing server startup. Please ensure MongoDB is running or configure a valid MONGODB_URI in .env');
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/ai/advisor', aiAdvisorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/action-plans', actionPlanRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling middleware with production message sanitization
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  const isProd = process.env.NODE_ENV === 'production';
  const clientMessage = isProd ? 'Internal server error' : (err.message || 'Something went wrong');
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: clientMessage
  });
});

export default app;
