import mongoose from 'mongoose';
import ImportBatch from '../models/ImportBatch.js';
import Transaction from '../models/Transaction.js';
import {
  parseCSVBuffer,
  parseExcelBuffer,
  normalizeRawRecords,
  validateExcelBufferSignature,
  validateCSVBuffer
} from '../services/fileParserService.js';
import {
  enrichTransactions,
  generateTransactionFingerprint
} from '../services/transactionIntelligence.js';
import { processSMSBatch, parseSingleSMS } from '../services/smsParserService.js';

export const uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a CSV file to upload'
      });
    }

    const { originalname, size, buffer } = req.file;

    if (!originalname.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only CSV files (.csv) are supported'
      });
    }

    if (size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit'
      });
    }

    const csvValidation = validateCSVBuffer(buffer);
    if (!csvValidation.valid) {
      return res.status(400).json({
        success: false,
        message: csvValidation.message
      });
    }

    const rawRows = await parseCSVBuffer(buffer);
    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded CSV file contains no data rows'
      });
    }

    const normalized = normalizeRawRecords(rawRows);
    if (normalized.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract valid transaction rows. Please check file structure'
      });
    }

    // Fetch existing fingerprints to detect duplicates
    let existingFingerprints = new Set();
    if (mongoose.connection.readyState === 1) {
      try {
        const existingTx = await Transaction.find({ userId: req.userId }, 'fingerprint');
        existingFingerprints = new Set(existingTx.map((t) => t.fingerprint).filter(Boolean));
      } catch (e) {
        // fallback
      }
    }

    const enriched = await enrichTransactions(normalized, req.userId, existingFingerprints);

    let totalIncome = 0;
    let totalExpense = 0;
    let highConf = 0;
    let lowConf = 0;
    let dupes = 0;

    enriched.forEach((t) => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;

      if (t.confidence >= 0.85) highConf++;
      else if (t.confidence < 0.6) lowConf++;

      if (t.isDuplicate) dupes++;
    });

    const batch = await ImportBatch.create({
      userId: req.userId,
      source: 'csv',
      fileName: originalname,
      fileSize: size,
      totalRecords: rawRows.length,
      processedRecords: enriched.length,
      duplicateRecords: dupes,
      status: 'REVIEW_REQUIRED',
      summary: {
        totalIncome,
        totalExpense,
        highConfidenceCount: highConf,
        lowConfidenceCount: lowConf
      }
    });

    // Stage transactions under this batch
    const stagedDocs = enriched.map((t) => ({
      userId: req.userId,
      importBatchId: batch._id,
      title: t.title,
      merchant: t.merchant,
      amount: t.amount,
      type: t.type,
      category: t.category,
      paymentMethod: t.paymentMethod || 'card',
      description: t.description,
      source: 'csv',
      sourceReference: t.reference,
      externalTransactionId: t.reference,
      confidence: t.confidence,
      status: 'staged',
      fingerprint: t.fingerprint,
      isDuplicate: t.isDuplicate,
      transactionDate: t.date,
      metadata: { originalData: t.originalData, reason: t.intelligenceReason }
    }));

    await Transaction.insertMany(stagedDocs);

    return res.status(201).json({
      success: true,
      message: `Successfully processed ${enriched.length} transactions from CSV. Please review and confirm.`,
      batch,
      stagedCount: enriched.length
    });
  } catch (error) {
    console.error('uploadCSV error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error processing CSV file'
    });
  }
};

export const uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an Excel file to upload'
      });
    }

    const { originalname, size, buffer } = req.file;
    const lowerName = originalname.toLowerCase();

    if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xls')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only Excel spreadsheets (.xlsx, .xls) are supported'
      });
    }

    if (size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit'
      });
    }

    const excelValidation = validateExcelBufferSignature(buffer);
    if (!excelValidation.valid) {
      return res.status(400).json({
        success: false,
        message: excelValidation.message
      });
    }

    const rawRows = parseExcelBuffer(buffer);
    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded Excel file contains no data rows'
      });
    }

    const normalized = normalizeRawRecords(rawRows);
    if (normalized.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract valid transaction rows from spreadsheet'
      });
    }

    let existingFingerprints = new Set();
    if (mongoose.connection.readyState === 1) {
      try {
        const existingTx = await Transaction.find({ userId: req.userId }, 'fingerprint');
        existingFingerprints = new Set(existingTx.map((t) => t.fingerprint).filter(Boolean));
      } catch (e) {
        // fallback
      }
    }

    const enriched = await enrichTransactions(normalized, req.userId, existingFingerprints);

    let totalIncome = 0;
    let totalExpense = 0;
    let highConf = 0;
    let lowConf = 0;
    let dupes = 0;

    enriched.forEach((t) => {
      if (t.type === 'income') totalIncome += t.amount;
      else totalExpense += t.amount;

      if (t.confidence >= 0.85) highConf++;
      else if (t.confidence < 0.6) lowConf++;

      if (t.isDuplicate) dupes++;
    });

    const batch = await ImportBatch.create({
      userId: req.userId,
      source: 'excel',
      fileName: originalname,
      fileSize: size,
      totalRecords: rawRows.length,
      processedRecords: enriched.length,
      duplicateRecords: dupes,
      status: 'REVIEW_REQUIRED',
      summary: {
        totalIncome,
        totalExpense,
        highConfidenceCount: highConf,
        lowConfidenceCount: lowConf
      }
    });

    const stagedDocs = enriched.map((t) => ({
      userId: req.userId,
      importBatchId: batch._id,
      title: t.title,
      merchant: t.merchant,
      amount: t.amount,
      type: t.type,
      category: t.category,
      paymentMethod: t.paymentMethod || 'card',
      description: t.description,
      source: 'excel',
      sourceReference: t.reference,
      externalTransactionId: t.reference,
      confidence: t.confidence,
      status: 'staged',
      fingerprint: t.fingerprint,
      isDuplicate: t.isDuplicate,
      transactionDate: t.date,
      metadata: { originalData: t.originalData, reason: t.intelligenceReason }
    }));

    await Transaction.insertMany(stagedDocs);

    return res.status(201).json({
      success: true,
      message: `Successfully processed ${enriched.length} transactions from Excel. Please review and confirm.`,
      batch,
      stagedCount: enriched.length
    });
  } catch (error) {
    console.error('uploadExcel error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error processing Excel file'
    });
  }
};

export const ingestSMSMessages = async (req, res) => {
  try {
    let rawMessages = [];
    let fileName = 'Direct SMS Paste / Dataset';
    let fileSize = 0;

    // 1. Handle file upload (CSV or TXT)
    if (req.file) {
      const { originalname, size, buffer } = req.file;
      fileName = originalname;
      fileSize = size;
      const lowerName = originalname.toLowerCase();

      if (lowerName.endsWith('.csv')) {
        const rawRows = await parseCSVBuffer(buffer);
        rawRows.forEach((row) => {
          // Look for message, text, body, or description column
          const text = row.text || row.message || row.body || row.Description || row.Narration || Object.values(row)[0];
          const date = row.date || row.Date || row.timestamp || null;
          const sender = row.sender || row.Sender || row.from || 'SMS';
          if (text) rawMessages.push({ text: String(text).trim(), date, sender });
        });
      } else {
        // Plain text file with line-delimited messages
        const content = buffer.toString('utf-8');
        const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        lines.forEach((line) => rawMessages.push({ text: line }));
      }
    } else if (req.body.messages && Array.isArray(req.body.messages)) {
      rawMessages = req.body.messages;
      fileName = req.body.fileName || `SMS Batch (${rawMessages.length} msgs)`;
    } else if (req.body.text || req.body.message) {
      const content = req.body.text || req.body.message;
      const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 5);
      lines.forEach((line) => rawMessages.push({ text: line }));
      fileName = lines.length > 1 ? `Pasted Messages (${lines.length} items)` : 'Single Pasted SMS';
    }

    if (!rawMessages || rawMessages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one SMS message or upload a message dataset'
      });
    }

    // Fetch existing fingerprints to detect duplicates
    let existingFingerprints = new Set();
    if (mongoose.connection.readyState === 1) {
      try {
        const existingTx = await Transaction.find({ userId: req.userId }, 'fingerprint');
        existingFingerprints = new Set(existingTx.map((t) => t.fingerprint).filter(Boolean));
      } catch (e) {
        // fallback
      }
    }

    // Process and enrich through safe SMS intelligence parser
    const { stagedTransactions, metrics } = await processSMSBatch(
      rawMessages,
      req.userId,
      existingFingerprints
    );

    if (stagedTransactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No financial transaction messages could be extracted. Messages may be non-financial or OTP notifications.',
        metrics
      });
    }

    const batch = await ImportBatch.create({
      userId: req.userId,
      source: 'sms',
      fileName,
      fileSize,
      totalRecords: metrics.totalReceived,
      processedRecords: metrics.parsedCount,
      duplicateRecords: metrics.duplicateCount,
      failedRecords: metrics.rejectedCount,
      status: 'REVIEW_REQUIRED',
      summary: {
        totalIncome: metrics.totalIncome,
        totalExpense: metrics.totalExpense,
        highConfidenceCount: metrics.highConfidenceCount,
        lowConfidenceCount: metrics.lowConfidenceCount
      }
    });

    const stagedDocs = stagedTransactions.map((t) => ({
      userId: req.userId,
      importBatchId: batch._id,
      title: t.title,
      merchant: t.merchant,
      amount: t.amount,
      type: t.type,
      category: t.category,
      paymentMethod: t.paymentMethod || 'upi',
      description: t.description,
      source: 'sms',
      sourceReference: t.sourceReference,
      externalTransactionId: t.externalTransactionId,
      confidence: t.confidence,
      status: 'staged',
      fingerprint: t.fingerprint,
      isDuplicate: t.isDuplicate,
      transactionDate: t.date,
      metadata: t.metadata
    }));

    await Transaction.insertMany(stagedDocs);

    return res.status(201).json({
      success: true,
      message: `Successfully extracted and staged ${stagedDocs.length} financial transactions from SMS messages (${metrics.duplicateCount} possible duplicates flagged).`,
      batch,
      stagedCount: stagedDocs.length,
      metrics
    });
  } catch (error) {
    console.error('ingestSMSMessages error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error processing SMS messages'
    });
  }
};

export const getImportBatches = async (req, res) => {
  try {
    const batches = await ImportBatch.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: batches
    });
  } catch (error) {
    console.error('getImportBatches error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching import history'
    });
  }
};

export const getImportBatchById = async (req, res) => {
  try {
    const batch = await ImportBatch.findOne({ _id: req.params.id, userId: req.userId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Import batch not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: batch
    });
  } catch (error) {
    console.error('getImportBatchById error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching batch details'
    });
  }
};

export const getStagedTransactions = async (req, res) => {
  try {
    const query = {
      userId: req.userId,
    };
    if (req.params.id && req.params.id !== 'all') {
      query.importBatchId = req.params.id;
    } else {
      query.status = 'staged';
    }

    const transactions = await Transaction.find(query).sort({ transactionDate: -1, _id: -1 });

    return res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('getStagedTransactions error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching staged transactions'
    });
  }
};

export const updateStagedTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, merchant, category, amount, type, transactionDate, paymentMethod } = req.body;

    const tx = await Transaction.findOne({ _id: id, userId: req.userId });
    if (!tx) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (title !== undefined) tx.title = title.trim();
    if (merchant !== undefined) tx.merchant = merchant.trim();
    if (category !== undefined) tx.category = category.trim();
    if (paymentMethod !== undefined) tx.paymentMethod = paymentMethod;
    if (type !== undefined && ['income', 'expense', 'transfer'].includes(type)) tx.type = type;
    if (amount !== undefined && Number(amount) >= 0) tx.amount = Number(amount);
    if (transactionDate !== undefined) tx.transactionDate = new Date(transactionDate);

    // Regenerate fingerprint
    tx.fingerprint = generateTransactionFingerprint({
      userId: req.userId,
      date: tx.transactionDate,
      amount: tx.amount,
      merchant: tx.merchant,
      reference: tx.sourceReference,
      type: tx.type
    });

    tx.confidence = 1.0; // Marked as verified by human edit
    await tx.save();

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: tx
    });
  } catch (error) {
    console.error('updateStagedTransaction error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating staged transaction'
    });
  }
};

export const confirmTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const tx = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { status: 'confirmed', confidence: 1.0 },
      { new: true }
    );

    if (!tx) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (tx.importBatchId) {
      await ImportBatch.findByIdAndUpdate(tx.importBatchId, {
        $inc: { confirmedRecords: 1 }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction confirmed and saved to ledger',
      data: tx
    });
  } catch (error) {
    console.error('confirmTransaction error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error confirming transaction'
    });
  }
};

export const ignoreTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const tx = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { status: 'ignored' },
      { new: true }
    );

    if (!tx) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (tx.importBatchId) {
      await ImportBatch.findByIdAndUpdate(tx.importBatchId, {
        $inc: { ignoredRecords: 1 }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction marked as ignored',
      data: tx
    });
  } catch (error) {
    console.error('ignoreTransaction error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error ignoring transaction'
    });
  }
};

export const confirmAllBatchTransactions = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === 'all') {
      const updateResult = await Transaction.updateMany(
        { userId: req.userId, status: 'staged' },
        { status: 'confirmed', confidence: 1.0 }
      );

      return res.status(200).json({
        success: true,
        message: `Confirmed ${updateResult.modifiedCount} transactions into primary ledger`,
        confirmedCount: updateResult.modifiedCount
      });
    }

    const batch = await ImportBatch.findOne({ _id: id, userId: req.userId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Import batch not found'
      });
    }

    const updateResult = await Transaction.updateMany(
      { userId: req.userId, importBatchId: id, status: 'staged' },
      { status: 'confirmed', confidence: 1.0 }
    );

    batch.confirmedRecords = (batch.confirmedRecords || 0) + updateResult.modifiedCount;
    batch.status = 'COMPLETED';
    batch.completedAt = new Date();
    await batch.save();

    return res.status(200).json({
      success: true,
      message: `Confirmed ${updateResult.modifiedCount} transactions into primary ledger`,
      confirmedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('confirmAllBatchTransactions error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error confirming batch transactions'
    });
  }
};

export const deleteImportBatch = async (req, res) => {
  try {
    const { id } = req.params;

    // Remove staged or ignored transactions from this batch
    await Transaction.deleteMany({
      userId: req.userId,
      importBatchId: id,
      status: { $in: ['staged', 'ignored'] }
    });

    const batch = await ImportBatch.findOneAndDelete({ _id: id, userId: req.userId });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Import batch not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Import batch and unconfirmed staged records discarded successfully'
    });
  } catch (error) {
    console.error('deleteImportBatch error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting import batch'
    });
  }
};
