import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  handleCopilotChat,
  getSessions,
  deleteSession,
  handleExplainMetric,
  handleProactiveInsights
} from '../controllers/copilotController.js';

const router = express.Router();

// Enforce JWT authentication on all Copilot endpoints
router.use(protect);

router.post('/chat', handleCopilotChat);
router.get('/sessions', getSessions);
router.delete('/sessions/:id', deleteSession);
router.post('/explain', handleExplainMetric);
router.get('/proactive-insights', handleProactiveInsights);

export default router;
