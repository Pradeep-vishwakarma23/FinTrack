import { describe, it, expect } from 'vitest';
import store from '../redux/store';
import importReducer from '../redux/slices/importSlice';
import syntheticSMSData from '../data/synthetic_sms_dataset.json';

describe('Phase 2: Frontend SMS Ingestion & Dataset Tests', () => {
  it('loads synthetic SMS dataset with at least 30 messages covering diverse categories', () => {
    expect(Array.isArray(syntheticSMSData)).toBe(true);
    expect(syntheticSMSData.length).toBeGreaterThanOrEqual(30);

    const hasSalary = syntheticSMSData.some((s) => s.text.toLowerCase().includes('salary'));
    const hasFood = syntheticSMSData.some((s) => /swiggy|zomato/i.test(s.text));
    const hasShopping = syntheticSMSData.some((s) => /amazon|flipkart|myntra/i.test(s.text));
    const hasTransport = syntheticSMSData.some((s) => /uber|ola|rapido|petrol/i.test(s.text));
    const hasATM = syntheticSMSData.some((s) => /atm/i.test(s.text));
    const hasBills = syntheticSMSData.some((s) => /bescom|electricity|recharge|airtel/i.test(s.text));
    const hasInvestments = syntheticSMSData.some((s) => /zerodha|groww/i.test(s.text));

    expect(hasSalary).toBe(true);
    expect(hasFood).toBe(true);
    expect(hasShopping).toBe(true);
    expect(hasTransport).toBe(true);
    expect(hasATM).toBe(true);
    expect(hasBills).toBe(true);
    expect(hasInvestments).toBe(true);
  });

  it('importReducer handles importSMS.fulfilled action correctly', () => {
    const initialState = {
      batches: [],
      currentBatch: null,
      stagedTransactions: [],
      loading: false,
      uploading: false,
      error: '',
      successMessage: ''
    };

    const mockBatch = {
      _id: 'sms_batch_001',
      source: 'sms',
      fileName: 'SMS Batch (32 msgs)',
      totalRecords: 32,
      processedRecords: 30,
      duplicateRecords: 2,
      status: 'REVIEW_REQUIRED'
    };

    const action = {
      type: 'imports/importSMS/fulfilled',
      payload: {
        batch: mockBatch,
        message: 'Successfully processed 30 SMS messages'
      }
    };

    const nextState = importReducer(initialState, action);
    expect(nextState.batches).toHaveLength(1);
    expect(nextState.currentBatch).toEqual(mockBatch);
    expect(nextState.currentBatch.source).toBe('sms');
    expect(nextState.successMessage).toBe('Successfully processed 30 SMS messages');
  });

  it('importReducer handles importSMS.rejected action correctly', () => {
    const initialState = {
      batches: [],
      currentBatch: null,
      stagedTransactions: [],
      loading: false,
      uploading: false,
      error: '',
      successMessage: ''
    };

    const action = {
      type: 'imports/importSMS/rejected',
      payload: 'No financial transaction messages detected'
    };

    const nextState = importReducer(initialState, action);
    expect(nextState.uploading).toBe(false);
    expect(nextState.error).toBe('No financial transaction messages detected');
  });
});
