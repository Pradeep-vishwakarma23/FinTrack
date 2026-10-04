import mongoose from 'mongoose';

const importBatchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  source: {
    type: String,
    enum: {
      values: ['csv', 'excel', 'pdf', 'receipt_ocr', 'email', 'sms', 'notification', 'android_notification'],
      message: '{VALUE} is not a valid ingestion source'
    },
    required: [true, 'Source type is required']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  totalRecords: {
    type: Number,
    default: 0
  },
  processedRecords: {
    type: Number,
    default: 0
  },
  confirmedRecords: {
    type: Number,
    default: 0
  },
  ignoredRecords: {
    type: Number,
    default: 0
  },
  duplicateRecords: {
    type: Number,
    default: 0
  },
  failedRecords: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['UPLOADED', 'PROCESSING', 'REVIEW_REQUIRED', 'COMPLETED', 'FAILED'],
    default: 'REVIEW_REQUIRED',
    index: true
  },
  summary: {
    totalIncome: {
      type: Number,
      default: 0
    },
    totalExpense: {
      type: Number,
      default: 0
    },
    highConfidenceCount: {
      type: Number,
      default: 0
    },
    lowConfidenceCount: {
      type: Number,
      default: 0
    }
  },
  errorMessage: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: {
    type: Date,
    default: null
  }
});

importBatchSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('ImportBatch', importBatchSchema);
