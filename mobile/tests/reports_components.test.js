import React from 'react';
import renderer, { act } from 'react-test-renderer';
import reportService from '../src/services/reportService.js';
import api, { getApiBaseUrl } from '../src/services/api.js';
import ReportsScreen from '../src/screens/reports/ReportsScreen.jsx';

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///data/user/0/fintrack/files/',
  cacheDirectory: 'file:///data/user/0/fintrack/cache/',
  downloadAsync: jest.fn(() => Promise.resolve({ status: 200, uri: 'file:///data/user/0/fintrack/cache/temp_123_FinTrack_Report_2026_09.pdf' })),
  readAsStringAsync: jest.fn(() => Promise.resolve('%PDF-1.3')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  copyAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 2048 })),
  getContentUriAsync: jest.fn(async (uri) => `content://fintrack.fileprovider/${uri.split('/').pop()}`),
  StorageAccessFramework: {
    getUriForDirectoryInRoot: jest.fn((dir) => `content://com.android.externalstorage.documents/tree/primary%3A${dir}`),
    requestDirectoryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true, directoryUri: 'content://com.android.externalstorage.documents/tree/primary%3ADownload' })),
    createFileAsync: jest.fn(() => Promise.resolve('content://com.android.externalstorage.documents/document/primary%3ADownload%2FFinTrack_Report_2026_09.pdf')),
    writeAsStringAsync: jest.fn(() => Promise.resolve()),
    readAsStringAsync: jest.fn(() => Promise.resolve('%PDF-1.3')),
  },
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
}));

jest.mock('../src/services/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
  getApiBaseUrl: jest.fn(() => 'http://localhost:5000/api'),
}));

// Helper to recursively collect all rendered text safely without circular JSON issues
const collectText = (node) => {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join(' ');
  if (node.children) return collectText(node.children);
  return '';
};

describe('FinTrack Mobile - Phase 9 Reports Service & UI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reportService API tests', () => {
    it('calls getMonthlyReport with month parameter correctly', async () => {
      const mockData = {
        reportMetadata: { month: '2026-09' },
        summary: { totalIncome: 50000, totalExpenses: 20000, netSavings: 30000, savingsRate: 60 },
      };
      api.get.mockResolvedValueOnce({
        success: true,
        data: mockData,
      });

      const res = await reportService.getMonthlyReport('2026-09');
      expect(api.get).toHaveBeenCalledWith('/reports/monthly', { params: { month: '2026-09' } });
      expect(res.success).toBe(true);
      expect(res.data.summary.totalIncome).toBe(50000);
    });

    it('generates the correct PDF stream URL for download', () => {
      const url = reportService.getMonthlyReportPDFUrl('2026-09');
      expect(url).toBe('http://localhost:5000/api/reports/monthly/pdf?month=2026-09');
    });

    it('downloads monthly report PDF using authenticated token and FileSystem', async () => {
      const FileSystem = require('expo-file-system');
      const secureStore = require('../src/services/secureStore.js').default;

      jest.spyOn(secureStore, 'getToken').mockResolvedValueOnce('test-jwt-token-123');
      const mockDownload = jest.spyOn(FileSystem, 'downloadAsync').mockResolvedValueOnce({
        uri: 'file:///data/user/0/fintrack/cache/temp_123_FinTrack_Report_2026_09.pdf',
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      });

      const res = await reportService.downloadMonthlyReportPDF('2026-09');
      expect(res.success).toBe(true);
      expect(res.filename).toBe('FinTrack_Report_2026_09.pdf');
      expect(mockDownload).toHaveBeenCalledWith(
        'http://localhost:5000/api/reports/monthly/pdf?month=2026-09',
        expect.stringContaining('FinTrack_Report_2026_09.pdf'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token-123',
          }),
        })
      );
    });

    it('decodes base64 text stream to binary %PDF- bytes when base64 is detected', async () => {
      const FileSystem = require('expo-file-system');
      const secureStore = require('../src/services/secureStore.js').default;

      jest.spyOn(secureStore, 'getToken').mockResolvedValueOnce('test-token');
      jest.spyOn(FileSystem, 'downloadAsync').mockResolvedValueOnce({
        uri: 'file:///data/user/0/fintrack/cache/temp_123_FinTrack_Report_2026_09.pdf',
        status: 200,
      });

      // Mock readAsStringAsync returning Base64 string for %PDF-1.3
      const sampleBase64 = 'JVBERi0xLjMKJcfsj6IKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwo';
      jest.spyOn(FileSystem, 'readAsStringAsync').mockResolvedValue(sampleBase64);
      const mockWrite = jest.spyOn(FileSystem, 'writeAsStringAsync').mockResolvedValueOnce();

      const res = await reportService.downloadMonthlyReportPDF('2026-09');
      expect(res.success).toBe(true);
      expect(mockWrite).toHaveBeenCalledWith(
        expect.stringContaining('FinTrack_Report_2026_09.pdf'),
        sampleBase64,
        expect.objectContaining({
          encoding: 'base64',
        })
      );
    });

    it('saves to Android Downloads via StorageAccessFramework when permission is granted', async () => {
      const FileSystem = require('expo-file-system');
      const secureStore = require('../src/services/secureStore.js').default;

      jest.spyOn(secureStore, 'getToken').mockResolvedValueOnce('test-token');
      jest.spyOn(FileSystem, 'downloadAsync').mockResolvedValueOnce({
        uri: 'file:///data/user/0/fintrack/cache/temp_FinTrack_Report_2026_09.pdf',
        status: 200,
      });
      jest.spyOn(FileSystem.StorageAccessFramework, 'requestDirectoryPermissionsAsync').mockResolvedValueOnce({
        granted: true,
        directoryUri: 'content://com.android.externalstorage.documents/tree/primary%3ADownload',
      });
      jest.spyOn(FileSystem.StorageAccessFramework, 'createFileAsync').mockResolvedValueOnce(
        'content://com.android.externalstorage.documents/document/primary%3ADownload%2FFinTrack_Report_2026_09.pdf'
      );
      const mockSafWrite = jest.spyOn(FileSystem.StorageAccessFramework, 'writeAsStringAsync').mockResolvedValueOnce();

      const res = await reportService.downloadMonthlyReportPDF('2026-09');
      expect(res.success).toBe(true);
      expect(res.savedToUserStorage).toBe(true);
      expect(res.uri).toContain('content://com.android.externalstorage.documents');
      expect(mockSafWrite).toHaveBeenCalledWith(
        expect.stringContaining('FinTrack_Report_2026_09.pdf'),
        expect.any(String),
        expect.objectContaining({ encoding: 'base64' })
      );
    });

    it('falls back to internal document storage when StorageAccessFramework permission is cancelled', async () => {
      const FileSystem = require('expo-file-system');
      const secureStore = require('../src/services/secureStore.js').default;

      jest.spyOn(secureStore, 'getToken').mockResolvedValueOnce('test-token');
      jest.spyOn(FileSystem, 'downloadAsync').mockResolvedValueOnce({
        uri: 'file:///data/user/0/fintrack/cache/temp_FinTrack_Report_2026_09.pdf',
        status: 200,
      });
      jest.spyOn(FileSystem.StorageAccessFramework, 'requestDirectoryPermissionsAsync').mockResolvedValueOnce({
        granted: false,
      });

      const res = await reportService.downloadMonthlyReportPDF('2026-09');
      expect(res.success).toBe(true);
      expect(res.savedToUserStorage).toBe(false);
      expect(res.uri).toContain('file:///data/user/0/fintrack/files/FinTrack_Report_2026_09.pdf');
    });

    it('throws descriptive error if download response status is not 200', async () => {
      const FileSystem = require('expo-file-system');
      const secureStore = require('../src/services/secureStore.js').default;

      jest.spyOn(secureStore, 'getToken').mockResolvedValueOnce('test-token');
      jest.spyOn(FileSystem, 'downloadAsync').mockResolvedValueOnce({
        status: 401,
      });

      await expect(reportService.downloadMonthlyReportPDF('2026-09')).rejects.toThrow(
        /Authentication required/
      );
    });
  });

  describe('ReportsScreen UI Rendering Tests', () => {
    it('renders loading state initially while fetching report', async () => {
      let resolvePromise;
      api.get.mockReturnValueOnce(new Promise((resolve) => { resolvePromise = resolve; }));

      let component;
      await act(async () => {
        component = renderer.create(<ReportsScreen navigation={{ canGoBack: () => true, goBack: jest.fn() }} />);
      });

      const root = component.root;
      expect(root).toBeDefined();

      // Resolve API
      await act(async () => {
        resolvePromise({
          success: true,
          data: {
            summary: { totalIncome: 0, totalExpenses: 0, netSavings: 0, savingsRate: 0 },
            categories: [],
            merchants: [],
            goals: [],
            actionPlans: [],
            anomalies: [],
            recurring: [],
            transactions: [],
            transactionSummary: { totalTransactions: 0 },
          },
        });
      });
    });

    it('renders full report content with financial metrics, categories, goals, and action plans', async () => {
      const mockReport = {
        reportMetadata: { month: '2026-09' },
        summary: {
          totalIncome: 60000,
          totalExpenses: 20000,
          netSavings: 40000,
          savingsRate: 66.67,
        },
        categories: [
          { category: 'Groceries', amount: 8000, percentage: 40, count: 3 },
          { category: 'Rent', amount: 12000, percentage: 60, count: 1 },
        ],
        merchants: [
          { merchant: 'Apartment', totalSpending: 12000, transactionCount: 1 },
          { merchant: 'Blinkit', totalSpending: 8000, transactionCount: 3 },
        ],
        budget: {
          monthlyBudget: 30000,
          spent: 20000,
          remaining: 10000,
          utilization: 66.7,
          riskLevel: 'Low',
        },
        trends: {
          available: true,
          savingsMomentum: 'IMPROVING',
          expenseTrend: 'decreasing',
          incomeTrend: 'increasing',
          savingsTrend: 'improving',
        },
        recurring: [
          {
            merchant: 'Netflix',
            cadence: 'monthly',
            typicalAmount: 649,
            nextExpectedPayment: '2026-10-15',
            confidence: 'HIGH',
          },
        ],
        goals: [
          {
            goalId: 'g1',
            name: 'Emergency Fund',
            targetAmount: 100000,
            currentAmount: 50000,
            progressPercentage: 50,
            requiredMonthlySavings: 5000,
            status: 'in_progress',
            feasibility: 'HIGHLY_FEASIBLE',
          },
        ],
        actionPlans: [
          {
            planId: 'ap1',
            title: 'Reduce Discretionary Spend',
            priority: 'HIGH',
            potentialMonthlyImpact: 1500,
            potentialSixMonthImpact: 9000,
            rationale: 'Grocery spend is elevated above baseline.',
          },
        ],
        anomalies: [
          {
            merchant: 'Electronics Store',
            amount: 15000,
            severity: 'HIGH',
            reason: 'Single purchase exceeds 50% of budget.',
          },
        ],
        transactionSummary: {
          incomeTransactions: 1,
          expenseTransactions: 4,
          transferTransactions: 0,
          totalTransactions: 5,
        },
        transactions: [
          {
            _id: 't1',
            title: 'Salary Deposit',
            amount: 60000,
            type: 'income',
            category: 'Salary',
            transactionDate: '2026-09-01T10:00:00.000Z',
          },
          {
            _id: 't2',
            title: 'Rent payment',
            amount: 12000,
            type: 'expense',
            category: 'Rent',
            transactionDate: '2026-09-02T10:00:00.000Z',
          },
        ],
      };

      api.get.mockResolvedValueOnce({
        success: true,
        data: mockReport,
      });

      let component;
      await act(async () => {
        component = renderer.create(<ReportsScreen navigation={{ canGoBack: () => true, goBack: jest.fn() }} />);
      });

      const text = collectText(component.toJSON());
      expect(text).toContain('Financial Statement');
      expect(text).toContain('66.67%');
      expect(text).toContain('Groceries');
      expect(text).toContain('Apartment');
      expect(text).toContain('Emergency Fund');
      expect(text).toContain('Reduce Discretionary Spend');
      expect(text).toContain('Netflix');
      expect(text).toContain('Salary Deposit');

      const downloadBtn = component.root.findByProps({ testID: 'report-download-pdf-btn' });
      expect(downloadBtn).toBeDefined();
    });

    it('renders empty states gracefully when no data exists for the period', async () => {
      const emptyReport = {
        reportMetadata: { month: '2026-09' },
        summary: { totalIncome: 0, totalExpenses: 0, netSavings: 0, savingsRate: 0 },
        categories: [],
        merchants: [],
        budget: null,
        trends: { available: false, message: 'Insufficient historical data for trend analysis.' },
        recurring: [],
        goals: [],
        actionPlans: [],
        anomalies: [],
        transactions: [],
        transactionSummary: { totalTransactions: 0, incomeTransactions: 0, expenseTransactions: 0, transferTransactions: 0 },
      };

      api.get.mockResolvedValueOnce({
        success: true,
        data: emptyReport,
      });

      let component;
      await act(async () => {
        component = renderer.create(<ReportsScreen navigation={{ canGoBack: () => false }} />);
      });

      const text = collectText(component.toJSON());
      expect(text).toContain('No expense records found for this period.');
      expect(text).toContain('No active savings goals found.');
      expect(text).toContain('No active action plans for this period.');
      expect(text).toContain('No spending anomalies detected in this period.');
      expect(text).toContain('Insufficient historical data for trend analysis.');
    });

    it('handles Download PDF button press successfully and displays confirmation with Open and Share', async () => {
      const RN = require('react-native');
      const Alert = RN.Alert;
      if (!RN.Share) {
        RN.Share = { share: jest.fn() };
      }
      jest.spyOn(Alert, 'alert');
      jest.spyOn(RN.Share, 'share').mockResolvedValueOnce({ action: 'sharedAction' });
      jest.spyOn(reportService, 'downloadMonthlyReportPDF').mockResolvedValueOnce({
        success: true,
        filename: 'FinTrack_Report_2026_09.pdf',
        uri: 'content://com.android.externalstorage.documents/document/primary%3ADownload%2FFinTrack_Report_2026_09.pdf',
        shareUri: 'content://com.android.externalstorage.documents/document/primary%3ADownload%2FFinTrack_Report_2026_09.pdf',
        savedToUserStorage: true,
      });

      api.get.mockResolvedValueOnce({
        success: true,
        data: {
          reportMetadata: { month: '2026-09' },
          summary: { totalIncome: 0, totalExpenses: 0, netSavings: 0, savingsRate: 0 },
        },
      });

      let component;
      await act(async () => {
        component = renderer.create(<ReportsScreen navigation={{ canGoBack: () => false }} />);
      });

      const downloadBtn = component.root.findByProps({ testID: 'report-download-pdf-btn' });
      await act(async () => {
        downloadBtn.props.onPress();
      });

      expect(reportService.downloadMonthlyReportPDF).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Report Exported',
        expect.stringContaining('FinTrack_Report_2026_09.pdf'),
        expect.any(Array)
      );

      // Trigger Open PDF action from Alert button
      const alertButtons = Alert.alert.mock.calls[0][2];
      const openBtn = alertButtons.find((b) => b.text === 'Open PDF');
      const shareBtn = alertButtons.find((b) => b.text === 'Share');
      expect(openBtn).toBeDefined();
      expect(shareBtn).toBeDefined();

      if (!RN.Linking) {
        RN.Linking = { openURL: jest.fn() };
      }
      jest.spyOn(RN.Linking, 'openURL').mockResolvedValue(true);

      await act(async () => {
        await openBtn.onPress();
      });

      expect(RN.Linking.openURL).toHaveBeenCalledWith(
        'content://com.android.externalstorage.documents/document/primary%3ADownload%2FFinTrack_Report_2026_09.pdf'
      );

      await act(async () => {
        await shareBtn.onPress();
      });

      expect(RN.Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'FinTrack_Report_2026_09.pdf',
          url: 'content://com.android.externalstorage.documents/document/primary%3ADownload%2FFinTrack_Report_2026_09.pdf',
        })
      );
    });

    it('handles Open PDF failure gracefully by alerting user that share is available', async () => {
      const RN = require('react-native');
      const Alert = RN.Alert;
      jest.spyOn(Alert, 'alert');
      jest.spyOn(reportService, 'downloadMonthlyReportPDF').mockResolvedValueOnce({
        success: true,
        filename: 'FinTrack_Report_2026_09.pdf',
        uri: 'file:///data/user/0/fintrack/files/FinTrack_Report_2026_09.pdf',
        shareUri: 'content://fintrack.fileprovider/FinTrack_Report_2026_09.pdf',
        savedToUserStorage: false,
      });

      api.get.mockResolvedValueOnce({
        success: true,
        data: {
          reportMetadata: { month: '2026-09' },
          summary: { totalIncome: 0, totalExpenses: 0, netSavings: 0, savingsRate: 0 },
        },
      });

      let component;
      await act(async () => {
        component = renderer.create(<ReportsScreen navigation={{ canGoBack: () => false }} />);
      });

      const downloadBtn = component.root.findByProps({ testID: 'report-download-pdf-btn' });
      await act(async () => {
        downloadBtn.props.onPress();
      });

      // Dialog is 'Report Ready' because savedToUserStorage is false
      expect(Alert.alert).toHaveBeenCalledWith(
        'Report Ready',
        expect.stringContaining('FinTrack_Report_2026_09.pdf'),
        expect.any(Array)
      );

      const alertButtons = Alert.alert.mock.calls[0][2];
      const openBtn = alertButtons.find((b) => b.text === 'Open PDF');

      if (!RN.Linking) {
        RN.Linking = { openURL: jest.fn() };
      }
      jest.spyOn(RN.Linking, 'openURL').mockRejectedValueOnce(new Error('No Activity found to handle Intent'));

      await act(async () => {
        await openBtn.onPress();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Unable to Open PDF',
        'Unable to open the PDF. The report is still available to share.',
        expect.any(Array)
      );
    });
  });
});

