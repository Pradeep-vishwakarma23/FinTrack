import importService from '../src/services/importService.js';
import api from '../src/services/api.js';

jest.mock('../src/services/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('FinTrack Mobile - Import Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call POST /imports/csv with multipart form data', async () => {
    api.post.mockResolvedValueOnce({
      success: true,
      batch: { _id: 'batch_csv_1' },
      stagedCount: 5,
    });

    const mockFile = {
      uri: 'file:///path/to/statement.csv',
      name: 'statement.csv',
      mimeType: 'text/csv',
    };

    const res = await importService.uploadCSV(mockFile);

    expect(api.post).toHaveBeenCalledWith(
      '/imports/csv',
      expect.any(Object),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
    expect(res.batch._id).toBe('batch_csv_1');
  });

  it('should call POST /imports/excel with spreadsheet payload', async () => {
    api.post.mockResolvedValueOnce({
      success: true,
      batch: { _id: 'batch_xlsx_1' },
      stagedCount: 8,
    });

    const mockFile = {
      uri: 'file:///path/to/transactions.xlsx',
      name: 'transactions.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    const res = await importService.uploadExcel(mockFile);

    expect(api.post).toHaveBeenCalledWith(
      '/imports/excel',
      expect.any(Object),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
    expect(res.stagedCount).toBe(8);
  });

  it('should call POST /imports/sms with text payload', async () => {
    api.post.mockResolvedValueOnce({
      success: true,
      batch: { _id: 'batch_sms_1' },
      stagedCount: 3,
    });

    const payload = { text: '₹480 debited via UPI to SWIGGY' };
    const res = await importService.ingestSMS(payload);

    expect(api.post).toHaveBeenCalledWith('/imports/sms', payload);
    expect(res.stagedCount).toBe(3);
  });

  it('should call GET /imports for batch history', async () => {
    api.get.mockResolvedValueOnce({
      success: true,
      data: [{ _id: 'b1', fileName: 'sept.csv' }],
    });

    const res = await importService.getImportBatches();

    expect(api.get).toHaveBeenCalledWith('/imports');
    expect(res.data).toHaveLength(1);
  });

  it('should call GET /imports/:id for specific batch', async () => {
    api.get.mockResolvedValueOnce({
      success: true,
      data: { _id: 'b1', fileName: 'sept.csv' },
    });

    const res = await importService.getImportBatchById('b1');

    expect(api.get).toHaveBeenCalledWith('/imports/b1');
    expect(res.data._id).toBe('b1');
  });

  it('should call GET /imports/:batchId/transactions for staged items', async () => {
    api.get.mockResolvedValueOnce({
      success: true,
      data: [{ _id: 'staged_1', title: 'Swiggy', status: 'staged' }],
    });

    const res = await importService.getStagedTransactions('all');

    expect(api.get).toHaveBeenCalledWith('/imports/all/transactions');
    expect(res.data).toHaveLength(1);
  });

  it('should call PATCH /imports/transactions/:id to update staged item', async () => {
    api.patch.mockResolvedValueOnce({
      success: true,
      data: { _id: 'staged_1', amount: 520, category: 'Food' },
    });

    const res = await importService.updateStagedTransaction('staged_1', {
      amount: 520,
      category: 'Food',
    });

    expect(api.patch).toHaveBeenCalledWith('/imports/transactions/staged_1', {
      amount: 520,
      category: 'Food',
    });
    expect(res.data.amount).toBe(520);
  });

  it('should call POST /imports/transactions/:id/confirm to verify single item', async () => {
    api.post.mockResolvedValueOnce({
      success: true,
      data: { _id: 'staged_1', status: 'confirmed' },
    });

    const res = await importService.confirmTransaction('staged_1');

    expect(api.post).toHaveBeenCalledWith('/imports/transactions/staged_1/confirm');
    expect(res.data.status).toBe('confirmed');
  });

  it('should call POST /imports/transactions/:id/ignore to mark item ignored', async () => {
    api.post.mockResolvedValueOnce({
      success: true,
      data: { _id: 'staged_1', status: 'ignored' },
    });

    const res = await importService.ignoreTransaction('staged_1');

    expect(api.post).toHaveBeenCalledWith('/imports/transactions/staged_1/ignore');
    expect(res.data.status).toBe('ignored');
  });

  it('should call POST /imports/:batchId/confirm-all for bulk confirmation', async () => {
    api.post.mockResolvedValueOnce({
      success: true,
      confirmedCount: 12,
    });

    const res = await importService.confirmAllBatch('all');

    expect(api.post).toHaveBeenCalledWith('/imports/all/confirm-all');
    expect(res.confirmedCount).toBe(12);
  });

  it('should call DELETE /imports/:batchId to discard batch', async () => {
    api.delete.mockResolvedValueOnce({
      success: true,
      message: 'Batch discarded',
    });

    const res = await importService.deleteImportBatch('b1');

    expect(api.delete).toHaveBeenCalledWith('/imports/b1');
    expect(res.success).toBe(true);
  });
});
