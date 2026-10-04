import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  signup,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAccountStats
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Dedicated Authentication Rate Limiter
 * 15-minute window, max 10 attempts per IP in production to mitigate brute-force attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? (parseInt(process.env.AUTH_RATE_LIMIT_TEST_MAX, 10) || 1000) : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  }
});

router.post('/signup', authRateLimiter, signup);
router.post('/login', authRateLimiter, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.get('/stats', protect, getAccountStats);

export default router;
