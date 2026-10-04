import importReducer, {
  setSelectedBatchId,
  openEditModal,
  closeEditModal,
  openSMSPasteModal,
  closeSMSPasteModal,
  clearImportError,
  clearLastImportResult,
  fetchImportBatches,
  fetchStagedTransactions,
  uploadCSVFile,
  uploadExcelFile,
  ingestSMSMessages,
  confirmStagedTransaction,
  ignoreStagedTransaction,
  updateAndConfirmStaged,
  confirmAllStagedTransactions,
  deleteBatch,
} from '../src/store/slices/importSlice.js';

describe('FinTrack Mobile - Import Redux Slice', () => {
  const initialState = {
    batches: [],
    stagedTransactions: [],
    pendingCount: 0,
    selectedBatchId: 'all',
    selectedTransaction: null,
    isEditModalOpen: false,
    isSMSPasteModalOpen: false,
    isLoadingBatches: false,
    isLoadingStaged: false,
    isUploading: false,
    uploadStage: 'idle',
    isReviewing: false,
    lastImportResult: null,
    error: null,
    uploadError: null,
  };

  it('should return initial state by default', () => {
    expect(importReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('should handle synchronous modal and filter actions', () => {
    let state = importReducer(initialState, setSelectedBatchId('batch_99'));
    expect(state.selectedBatchId).toBe('batch_99');

    const sampleTx = { _id: 'tx_1', merchant: 'Swiggy', amount: 480 };
    state = importReducer(state, openEditModal(sampleTx));
    expect(state.isEditModalOpen).toBe(true);
    expect(state.selectedTransaction).toEqual(sampleTx);

    state = importReducer(state, closeEditModal());
    expect(state.isEditModalOpen).toBe(false);
    expect(state.selectedTransaction).toBeNull();

    state = importReducer(state, openSMSPasteModal());
    expect(state.isSMSPasteModalOpen).toBe(true);

    state = importReducer(state, closeSMSPasteModal());
    expect(state.isSMSPasteModalOpen).toBe(false);

    state = importReducer({ ...state, error: 'Fail', uploadError: 'Err' }, clearImportError());
    expect(state.error).toBeNull();
    expect(state.uploadError).toBeNull();

    state = importReducer({ ...state, lastImportResult: { count: 5 }, uploadStage: 'completed' }, clearLastImportResult());
    expect(state.lastImportResult).toBeNull();
    expect(state.uploadStage).toBe('idle');
  });

  it('should handle fetchImportBatches.fulfilled', () => {
    const mockBatches = [
      { _id: 'b1', fileName: 'sept.csv', source: 'csv' },
      { _id: 'b2', fileName: 'Direct SMS', source: 'sms' },
    ];

    const state = importReducer(
      initialState,
      fetchImportBatches.fulfilled(mockBatches, 'req_1')
    );

    expect(state.isLoadingBatches).toBe(false);
    expect(state.batches).toHaveLength(2);
    expect(state.batches[0]._id).toBe('b1');
  });

  it('should handle fetchStagedTransactions.fulfilled', () => {
    const mockStaged = [
      { _id: 'st_1', merchant: 'Swiggy', amount: 480, status: 'staged' },
      { _id: 'st_2', merchant: 'Amazon', amount: 1250, status: 'staged' },
    ];

    const state = importReducer(
      initialState,
      fetchStagedTransactions.fulfilled(
        { batchId: 'all', transactions: mockStaged },
        'req_2',
        'all'
      )
    );

    expect(state.isLoadingStaged).toBe(false);
    expect(state.stagedTransactions).toHaveLength(2);
    expect(state.pendingCount).toBe(2);
  });

  it('should handle uploadCSVFile lifecycle', () => {
    let state = importReducer(initialState, uploadCSVFile.pending('req_3'));
    expect(state.isUploading).toBe(true);
    expect(state.uploadStage).toBe('uploading');

    const mockResult = { success: true, stagedCount: 5, batch: { _id: 'b_new' } };
    state = importReducer(state, uploadCSVFile.fulfilled(mockResult, 'req_3'));
    expect(state.isUploading).toBe(false);
    expect(state.uploadStage).toBe('completed');
    expect(state.lastImportResult).toEqual(mockResult);

    state = importReducer(state, uploadCSVFile.rejected(null, 'req_3', null, 'File too large'));
    expect(state.isUploading).toBe(false);
    expect(state.uploadStage).toBe('error');
    expect(state.uploadError).toBe('File too large');
  });

  it('should handle confirmStagedTransaction.fulfilled by removing item and decrementing pendingCount', () => {
    const startState = {
      ...initialState,
      stagedTransactions: [
        { _id: 'st_1', merchant: 'Swiggy', amount: 480 },
        { _id: 'st_2', merchant: 'Amazon', amount: 1250 },
      ],
      pendingCount: 2,
    };

    const state = importReducer(
      startState,
      confirmStagedTransaction.fulfilled({ id: 'st_1', data: {} }, 'req_4', 'st_1')
    );

    expect(state.stagedTransactions).toHaveLength(1);
    expect(state.stagedTransactions[0]._id).toBe('st_2');
    expect(state.pendingCount).toBe(1);
  });

  it('should handle ignoreStagedTransaction.fulfilled by removing item and decrementing pendingCount', () => {
    const startState = {
      ...initialState,
      stagedTransactions: [
        { _id: 'st_1', merchant: 'Swiggy', amount: 480 },
        { _id: 'st_2', merchant: 'Amazon', amount: 1250 },
      ],
      pendingCount: 2,
    };

    const state = importReducer(
      startState,
      ignoreStagedTransaction.fulfilled({ id: 'st_2', data: {} }, 'req_5', 'st_2')
    );

    expect(state.stagedTransactions).toHaveLength(1);
    expect(state.stagedTransactions[0]._id).toBe('st_1');
    expect(state.pendingCount).toBe(1);
  });

  it('should handle updateAndConfirmStaged.fulfilled by closing edit modal and removing item', () => {
    const startState = {
      ...initialState,
      isEditModalOpen: true,
      selectedTransaction: { _id: 'st_1', merchant: 'Swiggy' },
      stagedTransactions: [{ _id: 'st_1', merchant: 'Swiggy' }],
      pendingCount: 1,
    };

    const state = importReducer(
      startState,
      updateAndConfirmStaged.fulfilled(
        { id: 'st_1', data: {} },
        'req_6',
        { id: 'st_1', data: { amount: 500 } }
      )
    );

    expect(state.isEditModalOpen).toBe(false);
    expect(state.selectedTransaction).toBeNull();
    expect(state.stagedTransactions).toHaveLength(0);
    expect(state.pendingCount).toBe(0);
  });

  it('should handle confirmAllStagedTransactions.fulfilled for all batches', () => {
    const startState = {
      ...initialState,
      stagedTransactions: [
        { _id: 'st_1', merchant: 'Swiggy', importBatchId: 'b1' },
        { _id: 'st_2', merchant: 'Amazon', importBatchId: 'b2' },
      ],
      pendingCount: 2,
    };

    const state = importReducer(
      startState,
      confirmAllStagedTransactions.fulfilled(
        { batchId: 'all', response: { confirmedCount: 2 } },
        'req_7',
        'all'
      )
    );

    expect(state.stagedTransactions).toHaveLength(0);
    expect(state.pendingCount).toBe(0);
  });

  it('should handle deleteBatch.fulfilled by removing batch and staged items', () => {
    const startState = {
      ...initialState,
      batches: [
        { _id: 'b1', fileName: 'sep.csv' },
        { _id: 'b2', fileName: 'oct.csv' },
      ],
      stagedTransactions: [
        { _id: 'st_1', importBatchId: 'b1' },
        { _id: 'st_2', importBatchId: 'b2' },
      ],
      pendingCount: 2,
    };

    const state = importReducer(
      startState,
      deleteBatch.fulfilled({ batchId: 'b1' }, 'req_8', 'b1')
    );

    expect(state.batches).toHaveLength(1);
    expect(state.batches[0]._id).toBe('b2');
    expect(state.stagedTransactions).toHaveLength(1);
    expect(state.stagedTransactions[0]._id).toBe('st_2');
    expect(state.pendingCount).toBe(1);
  });
});
