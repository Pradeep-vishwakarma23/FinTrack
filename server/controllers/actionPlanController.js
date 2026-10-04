import {
  getActionPlans,
  getActionPlanById,
  createActionPlan,
  updateActionPlan,
  deleteActionPlan,
  generateAndSaveActionPlans,
  completeActionPlan,
  dismissActionPlan
} from '../services/actionPlanService.js';

/**
 * GET /api/action-plans
 * Returns action plans for the authenticated user.
 */
export const getPlans = async (req, res) => {
  try {
    const { status, actionType, priority, limit } = req.query;

    const plans = await getActionPlans({
      userId: req.userId,
      status,
      actionType,
      priority,
      limit
    });

    return res.status(200).json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error fetching action plans.'
    });
  }
};

/**
 * GET /api/action-plans/:id
 * Returns a single action plan by ID.
 */
export const getPlanById = async (req, res) => {
  try {
    const plan = await getActionPlanById({
      userId: req.userId,
      actionId: req.params.id
    });

    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    const statusCode = error.statusCode || (error.name === 'CastError' ? 400 : 500);
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error fetching action plan.'
    });
  }
};

/**
 * POST /api/action-plans
 * Manually creates a new action plan.
 */
export const createPlan = async (req, res) => {
  try {
    const plan = await createActionPlan({
      userId: req.userId,
      ...req.body
    });

    return res.status(201).json({
      success: true,
      data: plan
    });
  } catch (error) {
    const statusCode = error.name === 'ValidationError' ? 400 : (error.statusCode || 500);
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error creating action plan.'
    });
  }
};

/**
 * PUT /api/action-plans/:id
 * Updates an action plan.
 */
export const updatePlan = async (req, res) => {
  try {
    const plan = await updateActionPlan({
      userId: req.userId,
      actionId: req.params.id,
      updateData: req.body
    });

    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    const statusCode = error.statusCode || (error.name === 'CastError' ? 400 : 500);
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error updating action plan.'
    });
  }
};

/**
 * DELETE /api/action-plans/:id
 * Deletes an action plan.
 */
export const deletePlan = async (req, res) => {
  try {
    const result = await deleteActionPlan({
      userId: req.userId,
      actionId: req.params.id
    });

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || (error.name === 'CastError' ? 400 : 500);
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error deleting action plan.'
    });
  }
};

/**
 * POST /api/action-plans/generate
 * Automatically generates deterministic candidate action plans from verified intelligence.
 */
export const generatePlans = async (req, res) => {
  try {
    const month = req.body?.month || req.query?.month;

    const result = await generateAndSaveActionPlans({
      userId: req.userId,
      month
    });

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error generating action plans.'
    });
  }
};

/**
 * POST /api/action-plans/:id/complete
 * Marks an action plan as COMPLETED.
 */
export const completePlan = async (req, res) => {
  try {
    const plan = await completeActionPlan({
      userId: req.userId,
      actionId: req.params.id
    });

    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    const statusCode = error.statusCode || (error.name === 'CastError' ? 400 : 500);
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error completing action plan.'
    });
  }
};

/**
 * POST /api/action-plans/:id/dismiss
 * Marks an action plan as DISMISSED.
 */
export const dismissPlan = async (req, res) => {
  try {
    const plan = await dismissActionPlan({
      userId: req.userId,
      actionId: req.params.id
    });

    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    const statusCode = error.statusCode || (error.name === 'CastError' ? 400 : 500);
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error dismissing action plan.'
    });
  }
};
