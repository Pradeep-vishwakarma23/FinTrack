import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { generateAIInsights, predictExpense } from '../services/aiService.js';

export const generateInsights = async (req, res) => {
  try {
    const [transactions, budget] = await Promise.all([
      Transaction.find({ userId: req.userId, status: { $ne: 'staged' } }),
      Budget.findOne({ userId: req.userId })
    ]);

    const result = await generateAIInsights({ transactions, budget });

    return res.status(200).json({
      success: true,
      data: result,
      insights: result.insights,
      provider: result.provider
    });
  } catch (error) {
    console.error('generateInsights error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error generating AI insights'
    });
  }
};

export const predictSpending = async (req, res) => {
  try {
    const [transactions, budget] = await Promise.all([
      Transaction.find({ userId: req.userId, status: { $ne: 'staged' } }),
      Budget.findOne({ userId: req.userId })
    ]);

    const prediction = await predictExpense({ transactions, budget });

    return res.status(200).json({
      success: true,
      data: prediction,
      prediction
    });
  } catch (error) {
    console.error('predictSpending error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error predicting spending'
    });
  }
};