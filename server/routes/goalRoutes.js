import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getGoals,
  createGoal,
  getGoalById,
  updateGoal,
  deleteGoal
} from '../controllers/goalController.js';

const router = express.Router();

// Enforce JWT authentication on all Goal endpoints
router.use(protect);

router.get('/', getGoals);
router.post('/', createGoal);
router.get('/:id', getGoalById);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
