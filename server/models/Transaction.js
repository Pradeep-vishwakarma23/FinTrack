import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    enum: {
      values: ['income', 'expense', 'transfer'],
      message: '{VALUE} is not a valid transaction type'
    },
    required: [true, 'Transaction type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be greater than or equal to 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: {
      values: ['cash', 'card', 'bank_transfer', 'upi', 'wallet', 'other'],
      message: '{VALUE} is not a valid payment method'
    },
    default: 'card'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  merchant: {
    type: String,
    trim: true,
    default: ''
  },
  source: {
    type: String,
    enum: {
      values: ['manual', 'csv', 'excel', 'pdf', 'receipt_ocr', 'email', 'sms', 'notification', 'android_notification'],
      message: '{VALUE} is not a valid transaction source'
    },
    default: 'manual'
  },
  sourceReference: {
    type: String,
    trim: true,
    default: ''
  },
  externalTransactionId: {
    type: String,
    trim: true,
    default: ''
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 1.0
  },
  status: {
    type: String,
    enum: ['confirmed', 'staged', 'ignored'],
    default: 'confirmed',
    index: true
  },
  fingerprint: {
    type: String,
    trim: true,
    index: true
  },
  isDuplicate: {
    type: Boolean,
    default: false
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    default: ''
  },
  importBatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImportBatch',
    default: null,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  transactionDate: {
    type: Date,
    required: [true, 'Transaction date is required'],
    default: Date.now,
    index: true
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

transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, status: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ userId: 1, importBatchId: 1 });
transactionSchema.index({ userId: 1, fingerprint: 1 });

transactionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Transaction', transactionSchema);