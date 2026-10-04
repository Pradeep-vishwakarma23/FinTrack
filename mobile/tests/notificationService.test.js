import notificationListenerService from '../src/services/notificationListenerService.js';
import api from '../src/services/api.js';

jest.mock('../src/services/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('FinTrack Mobile - Notification Listener Service Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should toggle mock permission state in development/test environment', async () => {
    notificationListenerService.setMockPermission(false);
    expect(await notificationListenerService.isPermissionGranted()).toBe(false);

    notificationListenerService.setMockPermission(true);
    expect(await notificationListenerService.isPermissionGranted()).toBe(true);
  });

  it('should post normalized financial event to POST /mobile/events', async () => {
    api.post.mockResolvedValueOnce({
      success: true,
      stagedTransaction: { _id: 'tx_notif_1', status: 'staged', amount: 480 },
    });

    const mockEvent = {
      source: 'notification',
      merchant: 'Swiggy',
      amount: 480,
      type: 'expense',
      fingerprint: 'fp_123',
    };

    const res = await notificationListenerService.submitFinancialEvent(mockEvent);

    expect(api.post).toHaveBeenCalledWith('/mobile/events', mockEvent);
    expect(res.stagedTransaction._id).toBe('tx_notif_1');
  });

  it('should fetch user notification stats from GET /mobile/events/stats', async () => {
    api.get.mockResolvedValueOnce({
      success: true,
      stats: { totalEvents: 12, stagedCount: 8, confirmedCount: 4 },
    });

    const res = await notificationListenerService.getNotificationStats();

    expect(api.get).toHaveBeenCalledWith('/mobile/events/stats');
    expect(res.stats.totalEvents).toBe(12);
  });
});
