import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  ingestMobileEvent,
  getMobileEventStats
} from '../controllers/mobileEventsController.js';

const router = express.Router();

router.use(protect);

router.post('/events', ingestMobileEvent);
router.get('/events/stats', getMobileEventStats);
router.get('/status', getMobileEventStats);

export default router;
