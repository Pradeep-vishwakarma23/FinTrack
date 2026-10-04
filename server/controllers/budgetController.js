import Budget from '../models/Budget.js';

export const setBudget = async (req, res) => {
  try {
    const { monthlyBudget, categoryBudgets } = req.body;

    if (monthlyBudget === undefined || monthlyBudget === null || Number(monthlyBudget) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Monthly budget must be a non-negative number'
      });
    }

    const cleanCategoryBudgets = Array.isArray(categoryBudgets)
      ? categoryBudgets
          .filter((cb) => cb && cb.category && cb.limit !== undefined)
          .map((cb) => ({
            category: String(cb.category).trim(),
            limit: Math.max(0, Number(cb.limit) || 0)
          }))
      : [];

    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId },
      {
        userId: req.userId,
        monthlyBudget: Number(monthlyBudget),
        categoryBudgets: cleanCategoryBudgets,
        updatedAt: Date.now()
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Budget saved successfully',
      data: budget
    });
  } catch (error) {
    console.error('setBudget error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error setting budget'
    });
  }
};

export const getBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ userId: req.userId });

    if (!budget) {
      return res.status(200).json({
        success: true,
        data: {
          monthlyBudget: 0,
          categoryBudgets: []
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: budget
    });
  } catch (error) {
    console.error('getBudget error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching budget'
    });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { monthlyBudget, categoryBudgets } = req.body;

    if (monthlyBudget === undefined || monthlyBudget === null || Number(monthlyBudget) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Monthly budget must be a non-negative number'
      });
    }

    const cleanCategoryBudgets = Array.isArray(categoryBudgets)
      ? categoryBudgets
          .filter((cb) => cb && cb.category && cb.limit !== undefined)
          .map((cb) => ({
            category: String(cb.category).trim(),
            limit: Math.max(0, Number(cb.limit) || 0)
          }))
      : [];

    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId },
      {
        userId: req.userId,
        monthlyBudget: Number(monthlyBudget),
        categoryBudgets: cleanCategoryBudgets,
        updatedAt: Date.now()
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: budget
    });
  } catch (error) {
    console.error('updateBudget error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating budget'
    });
  }
};