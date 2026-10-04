import Transaction from '../models/Transaction.js';
import { generateTransactionFingerprint } from '../services/transactionIntelligence.js';

/**
 * Safely escapes special regular expression characters from user input.
 * Prevents ReDoS and syntax error crashes from arbitrary search strings.
 */
export const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const createTransaction = async (req, res) => {
  try {
    const { type, title, merchant, amount, category, paymentMethod, description, transactionDate, source } = req.body;

    if (!type || (!title && !merchant) || !category || amount === undefined || Number(amount) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide type, title/merchant, category, and a valid amount'
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Transaction type must be either income or expense'
      });
    }

    const finalTitle = (title || merchant || '').trim();
    const finalMerchant = (merchant || title || '').trim();
    const finalDate = transactionDate ? new Date(transactionDate) : new Date();

    const fingerprint = generateTransactionFingerprint({
      userId: req.userId,
      date: finalDate,
      amount: Number(amount),
      merchant: finalMerchant,
      type
    });

    // Check for existing matching duplicate
    const existingDuplicate = await Transaction.findOne({
      userId: req.userId,
      fingerprint,
      status: { $ne: 'ignored' }
    });

    const isDuplicate = Boolean(existingDuplicate);

    const transaction = await Transaction.create({
      userId: req.userId,
      type,
      title: finalTitle,
      merchant: finalMerchant,
      amount: Number(amount),
      category: category.trim(),
      paymentMethod: paymentMethod || 'card',
      description: description ? description.trim() : '',
      transactionDate: finalDate,
      source: source || 'manual',
      confidence: 1.0,
      status: 'confirmed',
      fingerprint,
      isDuplicate
    });

    return res.status(201).json({
      success: true,
      message: isDuplicate
        ? 'Transaction created (flagged as possible duplicate)'
        : 'Transaction created successfully',
      data: transaction,
      isDuplicate
    });
  } catch (error) {
    console.error('createTransaction error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating transaction'
    });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      type,
      source,
      search,
      sort = 'latest',
      startDate,
      endDate
    } = req.query;

    const query = {
      userId: req.userId,
      status: { $ne: 'staged' }
    };

    if (category && category !== 'All' && category !== 'all') {
      query.category = category;
    }

    if (type && type !== 'All' && type !== 'all') {
      query.type = type;
    }

    if (source && source !== 'All' && source !== 'all') {
      query.source = source;
    }

    if (search && search.trim()) {
      const sanitizedSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitizedSearch, 'i');
      query.$or = [
        { title: searchRegex },
        { merchant: searchRegex },
        { category: searchRegex },
        { description: searchRegex }
      ];
    }

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.transactionDate.$lte = end;
      }
    }

    const sortMap = {
      latest: { transactionDate: -1, _id: -1 },
      oldest: { transactionDate: 1, _id: 1 },
      amount_desc: { amount: -1, _id: -1 },
      amount_asc: { amount: 1, _id: 1 }
    };

    const sortCriteria = sortMap[sort] || sortMap.latest;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total, summaryAgg, stagedCount] = await Promise.all([
      Transaction.find(query).sort(sortCriteria).skip(skip).limit(limitNum),
      Transaction.countDocuments(query),
      Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
            },
            totalExpense: {
              $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
            }
          }
        }
      ]),
      Transaction.countDocuments({ userId: req.userId, status: 'staged' })
    ]);

    const pages = Math.ceil(total / limitNum) || 1;
    const aggResult = summaryAgg[0] || { totalIncome: 0, totalExpense: 0 };
    const filteredIncome = aggResult.totalIncome || 0;
    const filteredExpense = aggResult.totalExpense || 0;
    const filteredNet = filteredIncome - filteredExpense;

    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      },
      summary: {
        totalIncome: filteredIncome,
        totalExpense: filteredExpense,
        net: filteredNet,
        stagedCount
      }
    });
  } catch (error) {
    console.error('getTransactions error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching transactions'
    });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, merchant, amount, category, paymentMethod, description, transactionDate } = req.body;

    const updateFields = {};

    if (type !== undefined) {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Transaction type must be either income or expense'
        });
      }
      updateFields.type = type;
    }

    if (title !== undefined) updateFields.title = title.trim();
    if (merchant !== undefined) updateFields.merchant = merchant.trim();
    if (amount !== undefined) {
      const num = Number(amount);
      if (isNaN(num) || num < 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a non-negative number'
        });
      }
      updateFields.amount = num;
    }
    if (category !== undefined) updateFields.category = category.trim();
    if (paymentMethod !== undefined) updateFields.paymentMethod = paymentMethod;
    if (description !== undefined) updateFields.description = description.trim();
    if (transactionDate !== undefined) updateFields.transactionDate = new Date(transactionDate);

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    console.error('updateTransaction error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating transaction'
    });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('deleteTransaction error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting transaction'
    });
  }
};