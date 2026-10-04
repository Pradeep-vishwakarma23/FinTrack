import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [1, 'Target amount must be at least ₹1']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative']
  },
  targetDate: {
    type: Date,
    required: [true, 'Target date is required']
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Priority must be low, medium, or high'
    },
    default: 'medium'
  },
  status: {
    type: String,
    enum: {
      values: ['in_progress', 'completed', 'paused', 'cancelled'],
      message: 'Status must be in_progress, completed, paused, or cancelled'
    },
    default: 'in_progress',
    index: true
  },
  monthlyTarget: {
    type: Number,
    default: 0,
    min: [0, 'Monthly target cannot be negative']
  },
  notes: {
    type: String,
    default: '',
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound index for user goals
goalSchema.index({ userId: 1, status: 1, targetDate: 1 });

export default mongoose.model('Goal', goalSchema);
