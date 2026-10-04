import {
  generateGroundedAdvice,
  answerGroundedQuery,
  runWhatIfScenario,
  isValidMonthFormat
} from '../services/aiAdvisorService.js';

/**
 * POST /api/ai/advisor/advice
 * Generates personalized executive financial advice grounded strictly in the confirmed ledger.
 */
export const getAdvice = async (req, res) => {
  try {
    const { month } = req.body || {};

    if (month && !isValidMonthFormat(month)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month format. Expected YYYY-MM.'
      });
    }

    const result = await generateGroundedAdvice({
      userId: req.userId,
      month
    });

    return res.status(200).json({
      success: true,
      provider: result.provider,
      period: result.period,
      data: result.data
    });
  } catch (error) {
    console.error('[AI Advisor Controller] getAdvice error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error generating financial advice.'
    });
  }
};

/**
 * POST /api/ai/advisor/query
 * Answers financial questions grounded exclusively in the verified facts for the selected month.
 */
export const queryAdvisor = async (req, res) => {
  try {
    const { month, question } = req.body || {};

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid question string is required.'
      });
    }

    if (question.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Question exceeds maximum allowed length of 500 characters.'
      });
    }

    if (month && !isValidMonthFormat(month)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month format. Expected YYYY-MM.'
      });
    }

    const result = await answerGroundedQuery({
      userId: req.userId,
      month,
      question: question.trim()
    });

    return res.status(200).json({
      success: true,
      provider: result.provider,
      period: result.period,
      data: result.data
    });
  } catch (error) {
    console.error('[AI Advisor Controller] queryAdvisor error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error processing financial question.'
    });
  }
};

/**
 * POST /api/ai/advisor/what-if
 * Runs deterministic What-If simulation for category spending and income adjustments.
 */
export const simulateWhatIf = async (req, res) => {
  try {
    const { month, scenario } = req.body || {};

    if (!scenario || typeof scenario !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'A valid scenario object is required.'
      });
    }

    if (month && !isValidMonthFormat(month)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month format. Expected YYYY-MM.'
      });
    }

    const result = await runWhatIfScenario({
      userId: req.userId,
      month,
      scenario
    });

    return res.status(200).json({
      success: true,
      provider: result.provider,
      period: result.period,
      data: result.data
    });
  } catch (error) {
    console.error('[AI Advisor Controller] simulateWhatIf error:', error);
    const statusCode = error.message && error.message.includes('must be') ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error running what-if scenario.'
    });
  }
};
