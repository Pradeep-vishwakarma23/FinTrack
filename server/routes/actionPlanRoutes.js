import express from 'express';
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  generatePlans,
  completePlan,
  dismissPlan
} from '../controllers/actionPlanController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce JWT protection across all Action Plan routes
router.use(protect);

router.route('/')
  .get(getPlans)
  .post(createPlan);

router.post('/generate', generatePlans);

router.route('/:id')
  .get(getPlanById)
  .put(updatePlan)
  .delete(deletePlan);

router.post('/:id/complete', completePlan);
router.post('/:id/dismiss', dismissPlan);

export default router;
