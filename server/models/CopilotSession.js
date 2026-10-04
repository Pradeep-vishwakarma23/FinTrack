import mongoose from 'mongoose';

const copilotMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: [true, 'Message role is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message content cannot exceed 2000 characters']
  },
  provider: {
    type: String,
    enum: ['gemini', 'heuristic'],
    default: 'gemini'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const copilotSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  month: {
    type: String,
    required: [true, 'Month key is required in YYYY-MM format'],
    trim: true,
    match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in valid YYYY-MM format'],
    index: true
  },
  title: {
    type: String,
    default: 'Financial Conversation',
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  messages: {
    type: [copilotMessageSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for fast user session querying
copilotSessionSchema.index({ userId: 1, month: 1, updatedAt: -1 });

export default mongoose.model('CopilotSession', copilotSessionSchema);
