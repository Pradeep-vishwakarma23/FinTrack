import { describe, it, expect } from 'vitest';
import store from '../redux/store';
import importReducer, {
  setCurrentBatch,
  clearImportState,
  setStagedTransactions
} from '../redux/slices/importSlice';

describe('Phase 1: Redux Import Slice & Workflow State Tests', () => {
  it('registers imports slice in global redux store', () => {
    const state = store.getState();
    expect(state).toHaveProperty('imports');
    expect(state.imports).toHaveProperty('batches');
    expect(state.imports).toHaveProperty('stagedTransactions');
  });

  it('handles setCurrentBatch and clearImportState actions', () => {
    const mockBatch = {
      _id: 'batch_123',
      originalFileName: 'statement.csv',
      totalParsed: 10,
      status: 'REVIEW_REQUIRED'
    };

    store.dispatch(setCurrentBatch(mockBatch));
    let state = store.getState().imports;
    expect(state.currentBatch).toEqual(mockBatch);

    store.dispatch(clearImportState());
    state = store.getState().imports;
    expect(state.error).toBe('');
    expect(state.successMessage).toBe('');
  });

  it('handles setStagedTransactions action', () => {
    const mockStaged = [
      {
        _id: 'staged_1',
        merchant: 'SWIGGY',
        category: 'Food & Dining',
        amount: 450,
        status: 'staged',
        confidence: 0.95
      },
      {
        _id: 'staged_2',
        merchant: 'UBER',
        category: 'Transportation',
        amount: 250,
        status: 'staged',
        confidence: 0.88
      }
    ];

    store.dispatch(setStagedTransactions(mockStaged));
    const state = store.getState().imports;
    expect(state.stagedTransactions).toHaveLength(2);
    expect(state.stagedTransactions[0].merchant).toBe('SWIGGY');
  });

  it('reducer handles confirmAll action correctly', () => {
    const initialState = {
      batches: [{ _id: 'batch_123', status: 'REVIEW_REQUIRED' }],
      currentBatch: { _id: 'batch_123', status: 'REVIEW_REQUIRED' },
      stagedTransactions: [
        { _id: 'tx1', status: 'staged', confidence: 0.8 },
        { _id: 'tx2', status: 'staged', confidence: 0.9 }
      ],
      loading: false,
      uploading: false,
      error: '',
      successMessage: ''
    };

    const action = {
      type: 'imports/confirmAll/fulfilled',
      payload: { batchId: 'batch_123', message: 'All transactions confirmed' }
    };

    const nextState = importReducer(initialState, action);
    expect(nextState.stagedTransactions[0].status).toBe('confirmed');
    expect(nextState.stagedTransactions[1].status).toBe('confirmed');
    expect(nextState.stagedTransactions[0].confidence).toBe(1.0);
    expect(nextState.currentBatch.status).toBe('COMPLETED');
    expect(nextState.successMessage).toBe('All transactions confirmed');
  });

  it('reducer handles deleteBatch correctly', () => {
    const initialState = {
      batches: [
        { _id: 'batch_1', originalFileName: 'file1.csv' },
        { _id: 'batch_2', originalFileName: 'file2.csv' }
      ],
      currentBatch: { _id: 'batch_1', originalFileName: 'file1.csv' },
      stagedTransactions: [{ _id: 'tx1' }],
      loading: false,
      uploading: false,
      error: '',
      successMessage: ''
    };

    const action = {
      type: 'imports/deleteBatch/fulfilled',
      payload: 'batch_1'
    };

    const nextState = importReducer(initialState, action);
    expect(nextState.batches).toHaveLength(1);
    expect(nextState.batches[0]._id).toBe('batch_2');
    expect(nextState.currentBatch).toBeNull();
    expect(nextState.stagedTransactions).toEqual([]);
  });
});
