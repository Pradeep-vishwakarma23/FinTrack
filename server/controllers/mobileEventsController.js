import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import ImportBatch from '../models/ImportBatch.js';
import {
  extractMerchantAndCategory,
  generateTransactionFingerprint,
} from '../services/transactionIntelligence.js';
import { redactSensitiveData } from '../services/smsParserService.js';

// In-memory storage for tests / disconnected mode
const inMemoryList = [];

/**
 * Mobile Events Controller
 * Securely ingests on-device filtered financial notification events into the staging pipeline.
 */

export const ingestMobileEvent = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to ingest mobile events'
      });
    }

    const payload = req.body.event || req.body;
    let {
      merchant,
      title,
      amount,
      type = 'expense',
      category,
      paymentMethod = 'upi',
      transactionDate,
      date,
      sourceReference,
      externalTransactionId,
      packageName,
      appName,
      confidence,
      description,
      rawText
    } = payload;

    // 1. Mandatory Sensitive Data Re-sanitization (Defense in Depth)
    const rawInspectionText = `${merchant || ''} ${title || ''} ${description || ''} ${rawText || ''}`;
    if (/\b(?:otp|one time password|verification code|pin|cvv|password|security code)\b/i.test(rawInspectionText)) {
      return res.status(400).json({
        success: false,
        message: 'Rejected: Event contains sensitive security keywords or authentication codes.'
      });
    }
    const sanitizedText = redactSensitiveData(description || rawText || title || '');

    // 2. Validate Amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid positive financial amount is required'
      });
    }

    // 3. Normalize Date & Type
    const eventDate = transactionDate || date ? new Date(transactionDate || date) : new Date();
    const validDate = isNaN(eventDate.getTime()) ? new Date() : eventDate;
    const validType = ['income', 'expense', 'transfer'].includes(type) ? type : 'expense';

    // 4. Intelligence & Category Prediction
    const intelligence = extractMerchantAndCategory(
      `${merchant || ''} ${title || ''} ${sanitizedText}`,
      merchant,
      category
    );
    const finalMerchant = intelligence.merchant || merchant || title || 'Unknown Merchant';
    const finalCategory = intelligence.category || category || 'Other';
    const finalConfidence = confidence ? Math.min(1.0, Math.max(0.1, Number(confidence))) : intelligence.confidence;

    // 5. Generate Deterministic Fingerprint
    const fingerprint = generateTransactionFingerprint({
      userId,
      date: validDate,
      amount: parsedAmount,
      merchant: finalMerchant,
      reference: sourceReference || externalTransactionId || packageName || '',
      type: validType
    });
    
    if (process.env.NODE_ENV === 'production') {
      const safeHash = fingerprint ? `${fingerprint.substring(0, 10)}...` : 'event_hash';
      console.log(`[MobileEventsController] Ingesting event: hash=${safeHash} type=${validType} status=staged`);
    } else {
      console.log(`[MobileEventsController] Ingesting event for user ${userId}: ${finalMerchant} ₹${parsedAmount}, fingerprint: ${fingerprint}`);
    }

    // 6. Check for Duplicate in Database / Cache
    let isDuplicate = false;
    let existingTx = null;

    if (mongoose.connection.readyState === 1) {
      try {
        existingTx = await Transaction.findOne({ userId, fingerprint });
        if (existingTx) {
          isDuplicate = true;
          console.log(`[MobileEventsController] Duplicate detected in MongoDB against existingTx: ${existingTx._id}`);
        }
      } catch (err) {
        // Fallback to in-memory check
      }
    }

    if (!isDuplicate) {
      existingTx = inMemoryList.find(
        (tx) => String(tx.userId) === String(userId) && tx.fingerprint === fingerprint
      );
      if (existingTx) {
        isDuplicate = true;
        console.log(`[MobileEventsController] Duplicate detected in-memory against tx: ${existingTx._id}`);
      }
    }

    if (!isDuplicate) {
      console.log(`[MobileEventsController] New unique event (not a duplicate)`);
    }

    // 7. Find or Create Active Notification ImportBatch
    let batch = null;
    if (mongoose.connection.readyState === 1) {
      try {
        batch = await ImportBatch.findOne({
          userId,
          source: 'notification',
          status: 'REVIEW_REQUIRED'
        }).sort({ createdAt: -1 });

        if (!batch) {
          batch = await ImportBatch.create({
            userId,
            source: 'notification',
            fileName: 'Android Notification Stream',
            totalRecords: 0,
            processedRecords: 0,
            duplicateRecords: 0,
            status: 'REVIEW_REQUIRED',
            summary: {
              totalIncome: 0,
              totalExpense: 0,
              highConfidenceCount: 0,
              lowConfidenceCount: 0
            }
          });
        }
      } catch (err) {
        // Fallback
      }
    }

    // 8. Create Staged Transaction (Marked as duplicate if fingerprint already exists)
    let stagedDoc;
    if (mongoose.connection.readyState === 1) {
      stagedDoc = await Transaction.create({
        userId,
        importBatchId: batch?._id || null,
        title: finalMerchant,
        merchant: finalMerchant,
        amount: parsedAmount,
        type: validType,
        category: finalCategory,
        paymentMethod: paymentMethod || 'upi',
        description: sanitizedText.slice(0, 100),
        source: 'notification',
        sourceReference: sourceReference || externalTransactionId || packageName || 'Android Notification',
        externalTransactionId: externalTransactionId || sourceReference || '',
        confidence: finalConfidence,
        status: 'staged',
        fingerprint,
        isDuplicate: Boolean(isDuplicate),
        transactionDate: validDate,
        metadata: {
          packageName: packageName || 'com.android.system',
          appName: appName || 'Financial App',
          sourceType: 'android_notification',
          detectedAt: new Date().toISOString()
        }
      });
    } else {
      stagedDoc = {
        _id: 'mock_tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        userId,
        importBatchId: batch?._id || 'mock_batch_id',
        title: finalMerchant,
        merchant: finalMerchant,
        amount: parsedAmount,
        type: validType,
        category: finalCategory,
        paymentMethod: paymentMethod || 'upi',
        description: sanitizedText.slice(0, 100),
        source: 'notification',
        sourceReference: sourceReference || externalTransactionId || packageName || 'Android Notification',
        confidence: finalConfidence,
        status: 'staged',
        fingerprint,
        isDuplicate: Boolean(isDuplicate),
        transactionDate: validDate,
        createdAt: new Date()
      };
    }

    inMemoryList.push(stagedDoc);

    // Update batch stats
    if (batch) {
      batch.totalRecords = (batch.totalRecords || 0) + 1;
      batch.processedRecords = (batch.processedRecords || 0) + 1;
      if (isDuplicate) {
        batch.duplicateRecords = (batch.duplicateRecords || 0) + 1;
      }
      if (validType === 'income') {
        batch.summary.totalIncome = (batch.summary.totalIncome || 0) + parsedAmount;
      } else {
        batch.summary.totalExpense = (batch.summary.totalExpense || 0) + parsedAmount;
      }
      if (finalConfidence >= 0.85) {
        batch.summary.highConfidenceCount = (batch.summary.highConfidenceCount || 0) + 1;
      } else if (finalConfidence < 0.6) {
        batch.summary.lowConfidenceCount = (batch.summary.lowConfidenceCount || 0) + 1;
      }
      await batch.save();
    }

    return res.status(201).json({
      success: true,
      message: isDuplicate
        ? 'Duplicate financial notification intercepted and staged with duplicate flag.'
        : 'Financial notification successfully intercepted and staged for review.',
      isDuplicate: Boolean(isDuplicate),
      stagedTransaction: stagedDoc,
      batchId: batch?._id || 'mock_batch_id'
    });
  } catch (error) {
    console.error('ingestMobileEvent error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error processing mobile financial event'
    });
  }
};

export const getMobileEventStats = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    let notificationTxs = [];
    if (mongoose.connection.readyState === 1) {
      try {
        notificationTxs = await Transaction.find({
          userId,
          source: { $in: ['notification', 'android_notification'] }
        });
      } catch (err) {
        // Fallback
      }
    }

    if (notificationTxs.length === 0) {
      notificationTxs = inMemoryList.filter(
        (tx) => String(tx.userId) === String(userId)
      );
    }

    const totalEvents = notificationTxs.length;
    let stagedCount = 0;
    let confirmedCount = 0;
    let ignoredCount = 0;
    let duplicatesCount = 0;
    let lastDetectedAt = null;

    notificationTxs.forEach((tx) => {
      if (tx.status === 'staged') stagedCount++;
      else if (tx.status === 'confirmed') confirmedCount++;
      else if (tx.status === 'ignored') ignoredCount++;

      if (tx.isDuplicate) duplicatesCount++;

      const createdAt = tx.createdAt ? new Date(tx.createdAt).getTime() : 0;
      if (!lastDetectedAt || createdAt > new Date(lastDetectedAt).getTime()) {
        lastDetectedAt = tx.createdAt;
      }
    });

    if (process.env.NODE_ENV === 'production') {
      console.log(`[MobileEventsController] Stats query: total=${totalEvents}, staged=${stagedCount}, confirmed=${confirmedCount}, duplicates=${duplicatesCount}`);
    } else {
      console.log(`[MobileEventsController] Stats for user ${userId}: total=${totalEvents}, staged=${stagedCount}, confirmed=${confirmedCount}, duplicates=${duplicatesCount}`);
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalEvents,
        stagedCount,
        confirmedCount,
        ignoredCount,
        duplicatesCount,
        lastDetectedAt: lastDetectedAt || null,
        serviceStatus: 'active'
      }
    });
  } catch (error) {
    console.error('getMobileEventStats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching mobile event stats'
    });
  }
};

export default {
  ingestMobileEvent,
  getMobileEventStats
};
