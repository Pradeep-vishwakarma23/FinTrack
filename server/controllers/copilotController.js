import {
  processCopilotChat,
  getUserSessions,
  deleteUserSession,
  explainFinancialMetric
} from '../services/copilotService.js';
import { getProactiveInsights } from '../services/proactiveInsightService.js';

/**
 * POST /api/copilot/chat
 * Multi-turn conversational Copilot grounded in verified monthly financial intelligence.
 */
export const handleCopilotChat = async (req, res) => {
  try {
    const { sessionId, month, message } = req.body || {};

    const result = await processCopilotChat({
      userId: req.userId,
      sessionId,
      month,
      message
    });

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error processing Copilot chat.'
    });
  }
};

/**
 * GET /api/copilot/sessions
 * Returns all Copilot conversation sessions for the authenticated user.
 */
export const getSessions = async (req, res) => {
  try {
    const sessions = await getUserSessions({
      userId: req.userId,
      limit: req.query.limit
    });

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching Copilot sessions.'
    });
  }
};

/**
 * DELETE /api/copilot/sessions/:id
 * Deletes a user's Copilot conversation session.
 */
export const deleteSession = async (req, res) => {
  try {
    const deleted = await deleteUserSession({
      userId: req.userId,
      sessionId: req.params.id
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or does not belong to user.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Copilot session deleted successfully.'
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error deleting Copilot session.'
    });
  }
};

/**
 * POST /api/copilot/explain
 * Provides educational and grounded explanations for verified financial metrics.
 */
export const handleExplainMetric = async (req, res) => {
  try {
    const { month, contextType, itemData } = req.body || {};

    const result = await explainFinancialMetric({
      userId: req.userId,
      month,
      contextType,
      itemData
    });

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error generating metric explanation.'
    });
  }
};

/**
 * GET /api/copilot/proactive-insights?month=YYYY-MM
 * Evaluates deterministic conditions and returns prioritized proactive alerts.
 */
export const handleProactiveInsights = async (req, res) => {
  try {
    const { month } = req.query;

    const result = await getProactiveInsights({
      userId: req.userId,
      month
    });

    return res.status(200).json({
      success: true,
      period: result.period,
      count: result.count,
      data: result.data
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error generating proactive insights.'
    });
  }
};
