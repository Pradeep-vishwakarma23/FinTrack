import mongoose from 'mongoose';

const categoryBudgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  limit: {
    type: Number,
    required: [true, 'Category budget limit is required'],
    min: [0, 'Limit must be greater than or equal to 0']
  }
}, { _id: false });

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  monthlyBudget: {
    type: Number,
    required: [true, 'Monthly budget is required'],
    min: [0, 'Monthly budget must be greater than or equal to 0'],
    default: 0
  },
  categoryBudgets: {
    type: [categoryBudgetSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

budgetSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Budget', budgetSchema);