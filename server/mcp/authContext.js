/**
 * FinTrack MCP Architecture Phase 3: Authentication Context Boundary
 * Enforces strict authentication and user isolation for MCP tool execution.
 * Never allows client-supplied arbitrary userIds.
 * Derives userId strictly from verified JWT tokens or secure environment context.
 */

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

/**
 * Validates whether a month string is in valid YYYY-MM format.
 */
export const isValidMonthFormat = (monthStr) => {
  if (!monthStr || typeof monthStr !== 'string') return false;
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(monthStr.trim());
};

/**
 * Resolves the authenticated user context for an MCP request.
 *
 * Precedence:
 * 1. Explicit connection/request context (e.g. authToken or verified userId)
 * 2. FINTRACK_AUTH_TOKEN environment variable (JWT verified with JWT_SECRET)
 * 3. FINTRACK_USER_ID environment variable (validated MongoDB ObjectId string)
 *
 * Never falls back to default, first, hardcoded, or unauthenticated users.
 *
 * @param {Object} context
 * @param {string} [context.authToken] - JWT Bearer token
 * @param {string|mongoose.Types.ObjectId} [context.userId] - Verified user ObjectId from secure boundary
 * @returns {{ userId: mongoose.Types.ObjectId, userIdString: string, authMethod: string }}
 */
export const resolveAuthContext = (context = {}) => {
  // 1. Check explicit JWT token in request context or environment
  const token = context.authToken || context.token || process.env.FINTRACK_AUTH_TOKEN;
  if (token && typeof token === 'string' && token.trim().length > 0) {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    if (cleanToken) {
      try {
        const secret = process.env.JWT_SECRET || 'secret';
        const decoded = jwt.verify(cleanToken, secret);
        const resolvedId = decoded.id || decoded.userId || decoded._id;

        if (resolvedId && mongoose.Types.ObjectId.isValid(resolvedId)) {
          return {
            userId: new mongoose.Types.ObjectId(resolvedId),
            userIdString: resolvedId.toString(),
            authMethod: 'jwt_token'
          };
        }
      } catch (err) {
        const error = new Error(`Invalid or expired FinTrack authentication token: ${err.message}`);
        error.code = -32001;
        error.statusCode = 401;
        throw error;
      }
    }
  }

  // 2. Check explicit userId passed from trusted internal caller or environment
  const rawUserId = context.userId || process.env.FINTRACK_USER_ID;
  if (rawUserId) {
    const strId = rawUserId.toString().trim();
    if (mongoose.Types.ObjectId.isValid(strId)) {
      return {
        userId: new mongoose.Types.ObjectId(strId),
        userIdString: strId,
        authMethod: 'secure_env_userId'
      };
    }
    const error = new Error(`Invalid FINTRACK_USER_ID format: "${strId}". Must be a valid 24-character hexadecimal MongoDB ObjectId.`);
    error.code = -32001;
    error.statusCode = 401;
    throw error;
  }

  // 3. No authentication credentials found
  const error = new Error(
    'FinTrack MCP Authentication Required: No authenticated user session found. Please provide a valid FINTRACK_AUTH_TOKEN (JWT) or FINTRACK_USER_ID.'
  );
  error.code = -32001;
  error.statusCode = 401;
  throw error;
};
