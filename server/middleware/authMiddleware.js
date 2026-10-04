import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id || decoded.userId;
    req.userId = userId;

    if (userId && mongoose.connection.readyState === 1) {
      try {
        const user = await User.findById(userId).select('tokenVersion');
        if (user) {
          const tokenVersion = decoded.tokenVersion !== undefined ? decoded.tokenVersion : 0;
          const userTokenVersion = user.tokenVersion !== undefined ? user.tokenVersion : 0;
          if (tokenVersion !== userTokenVersion) {
            return res.status(401).json({
              success: false,
              message: 'Not authorized to access this route'
            });
          }
        }
      } catch (dbErr) {
        // If DB query fails
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};