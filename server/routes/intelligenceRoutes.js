import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getSummary,
  getMerchants,
  getAnomalies,
  getForecast,
  getSubscriptions,
  getTrends
} from '../controllers/intelligenceController.js';

const router = express.Router();

// Enforce JWT authentication on all intelligence endpoints
router.use(protect);

// Routes
router.get('/summary', getSummary);
router.get('/merchants', getMerchants);
router.get('/anomalies', getAnomalies);
router.get('/forecast', getForecast);
router.get('/subscriptions', getSubscriptions);
router.get('/trends', getTrends);

export default router;
