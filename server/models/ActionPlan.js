import mongoose from 'mongoose';

export const ACTION_TYPES = [
  'REDUCE_CATEGORY',
  'REDUCE_RECURRING',
  'INCREASE_SAVINGS',
  'MAINTAIN_SAVINGS',
  'GOAL_CONTRIBUTION',
  'REVIEW_ANOMALY'
];

export const ACTION_STATUSES = [
  'ACTIVE',
  'COMPLETED',
  'DISMISSED',
  'PAUSED'
];

export const ACTION_PRIORITIES = [
  'HIGH',
  'MEDIUM',
  'LOW'
];

export const ACTION_SOURCES = [
  'AUTOMATIC',
  'MANUAL',
  'COPILOT'
];

const actionPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Action plan title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  actionType: {
    type: String,
    required: [true, 'Action type is required'],
    enum: {
      values: ACTION_TYPES,
      message: '{VALUE} is not a valid action type'
    },
    index: true
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  targetAmount: {
    type: Number,
    default: 0,
    min: [0, 'Target amount cannot be negative']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative']
  },
  monthlyImpact: {
    type: Number,
    default: 0,
    min: [0, 'Monthly impact cannot be negative']
  },
  potentialSixMonthImpact: {
    type: Number,
    default: 0,
    min: [0, 'Potential 6-month impact cannot be negative']
  },
  targetDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: {
      values: ACTION_PRIORITIES,
      message: 'Priority must be HIGH, MEDIUM, or LOW'
    },
    default: 'MEDIUM',
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ACTION_STATUSES,
      message: 'Status must be ACTIVE, COMPLETED, DISMISSED, or PAUSED'
    },
    default: 'ACTIVE',
    index: true
  },
  source: {
    type: String,
    enum: {
      values: ACTION_SOURCES,
      message: 'Source must be AUTOMATIC, MANUAL, or COPILOT'
    },
    default: 'AUTOMATIC'
  },
  rationale: {
    type: String,
    trim: true,
    default: '',
    maxlength: [500, 'Rationale cannot exceed 500 characters']
  },
  relatedGoalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  completedAt: {
    type: Date,
    default: null
  },
  dismissedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Auto-calculate potentialSixMonthImpact before saving if not explicitly set
actionPlanSchema.pre('save', function (next) {
  if (this.monthlyImpact !== undefined && (!this.potentialSixMonthImpact || this.isModified('monthlyImpact'))) {
    this.potentialSixMonthImpact = Number((this.monthlyImpact * 6).toFixed(2));
  }
  next();
});

// Compound indexes for high performance querying & user isolation
actionPlanSchema.index({ userId: 1, status: 1, actionType: 1 });
actionPlanSchema.index({ userId: 1, status: 1, priority: 1 });
actionPlanSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('ActionPlan', actionPlanSchema);
