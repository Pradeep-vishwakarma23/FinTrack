import transactionService from '../src/services/transactionService.js';
import api from '../src/services/api.js';

jest.mock('../src/services/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('FinTrack Mobile - Transaction Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call GET /transactions with properly serialized query params', async () => {
    api.get.mockResolvedValueOnce({
      data: [{ title: 'Swiggy', amount: 480 }],
      pagination: { page: 1, limit: 15, total: 1, pages: 1 },
      summary: { totalIncome: 0, totalExpense: 480, net: -480 },
    });

    await transactionService.getTransactions({
      page: 2,
      limit: 15,
      type: 'expense',
      category: 'Food',
      source: 'notification',
      search: 'Swiggy',
      sort: 'amount_desc',
    });

    expect(api.get).toHaveBeenCalledWith(
      '/transactions?page=2&limit=15&category=Food&type=expense&source=notification&search=Swiggy&sort=amount_desc'
    );
  });

  it('should call POST /transactions for manual creation with correct defaults', async () => {
    const mockTx = {
      title: 'Bescom Bill',
      merchant: 'Bescom Bill',
      amount: 850,
      category: 'Bills',
      type: 'expense',
      paymentMethod: 'upi',
    };

    api.post.mockResolvedValueOnce({ data: { ...mockTx, _id: 'tx_123' }, isDuplicate: false });

    const result = await transactionService.createTransaction(mockTx);

    expect(api.post).toHaveBeenCalledWith('/transactions', expect.objectContaining({
      title: 'Bescom Bill',
      amount: 850,
      category: 'Bills',
      type: 'expense',
      source: 'manual',
    }));
    expect(result.data._id).toBe('tx_123');
  });

  it('should call PUT /transactions/:id for edits', async () => {
    api.put.mockResolvedValueOnce({ data: { _id: 'tx_123', amount: 950 } });

    await transactionService.updateTransaction('tx_123', {
      amount: 950,
      category: 'Utilities',
    });

    expect(api.put).toHaveBeenCalledWith('/transactions/tx_123', {
      amount: 950,
      category: 'Utilities',
    });
  });

  it('should call DELETE /transactions/:id for deletion', async () => {
    api.delete.mockResolvedValueOnce({ success: true, message: 'Deleted' });

    await transactionService.deleteTransaction('tx_123');

    expect(api.delete).toHaveBeenCalledWith('/transactions/tx_123');
  });
});
