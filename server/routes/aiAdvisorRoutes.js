import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getAdvice,
  queryAdvisor,
  simulateWhatIf
} from '../controllers/aiAdvisorController.js';

const router = express.Router();

// Enforce JWT authentication across all AI advisor endpoints
router.use(protect);

// Endpoints
router.post('/advice', getAdvice);
router.post('/query', queryAdvisor);
router.post('/what-if', simulateWhatIf);

export default router;
