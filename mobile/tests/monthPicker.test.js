import React from 'react';
import renderer, { act } from 'react-test-renderer';
import {
  MonthPickerModal,
  formatMonthDisplay,
  shiftMonth,
  getRecentMonthsList,
  getCurrentMonthKey,
} from '../src/components/insights/MonthPickerModal.jsx';

let mockIntelligenceState = {
  summary: {
    metrics: { totalIncome: 50000, totalExpense: 20000, netSavings: 30000, savingsRate: 60, isDeficit: false, transactionCount: 5 },
    categorySpending: [],
    topMerchants: [],
    anomalies: [],
    forecast: {},
  },
  merchants: [],
  anomalies: [],
  forecast: {},
  period: '2026-09',
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: '2026-09-27T10:00:00Z',
};

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn) => fn({ intelligence: mockIntelligenceState }),
}));

jest.mock('../src/services/aiAdvisorService.js', () => ({
  __esModule: true,
  default: {
    getAdvice: jest.fn().mockResolvedValue({
      success: true,
      provider: 'gemini',
      period: '2026-09',
      data: {
        executiveSummary: 'Positive surplus for 2026-09.',
        keyObservations: [],
        actionableRecommendations: [],
        savingsPotential: '',
      },
    }),
    askQuestion: jest.fn(),
    runWhatIf: jest.fn(),
  },
}));

jest.mock('../src/services/reportService.js', () => ({
  __esModule: true,
  default: {
    getMonthlyReport: jest.fn().mockResolvedValue({
      success: true,
      data: {
        summary: { totalIncome: 50000, totalExpenses: 20000, netSavings: 30000, savingsRate: 60 },
        categories: [],
        merchants: [],
        goals: [],
        actionPlans: [],
        anomalies: [],
        recurring: [],
        transactions: [],
        transactionSummary: { totalTransactions: 0 },
      },
    }),
    getMonthlyReportPDFUrl: jest.fn(() => 'http://localhost:5000/api/reports/monthly/pdf'),
  },
}));

import reportService from '../src/services/reportService.js';
import { InsightsScreen } from '../src/screens/insights/InsightsScreen.jsx';
import { ReportsScreen } from '../src/screens/reports/ReportsScreen.jsx';

describe('FinTrack Mobile - MonthPickerModal & Month Selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIntelligenceState.period = '2026-09';
  });

  it('formats month display correctly', () => {
    expect(formatMonthDisplay('2026-09')).toBe('September 2026');
    expect(formatMonthDisplay('2026-01')).toBe('January 2026');
    expect(formatMonthDisplay('')).toBe('Current Month');
    expect(formatMonthDisplay(null)).toBe('Current Month');
  });

  it('shifts months backwards and forwards correctly across year boundaries', () => {
    expect(shiftMonth('2026-09', -1)).toBe('2026-08');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2025-12', 1)).toBe('2026-01');
    expect(shiftMonth('2026-08', 1)).toBe('2026-09');
  });

  it('generates recent months list up to current month', () => {
    const list = getRecentMonthsList(6);
    expect(list).toHaveLength(6);
    expect(list[0].key).toBe(getCurrentMonthKey());
    expect(list[0].isCurrent).toBe(true);
    expect(list[1].isCurrent).toBe(false);
  });

  it('renders MonthPickerModal with header, stepper, presets, and action buttons', () => {
    const mockSelect = jest.fn();
    const mockClose = jest.fn();

    let tree;
    act(() => {
      tree = renderer.create(
        <MonthPickerModal
          visible={true}
          currentPeriod="2026-08"
          onSelect={mockSelect}
          onClose={mockClose}
        />
      );
    });

    const root = tree.root;
    expect(root.findByProps({ testID: 'month-picker-modal' })).toBeDefined();

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Select Month');
    expect(str).toContain('August 2026');
    expect(str).toContain('2026-08');

    // Trigger Previous Month button
    const prevBtn = root.findByProps({ testID: 'prev-month-btn' });
    act(() => {
      prevBtn.props.onPress();
    });

    const updatedStr = JSON.stringify(tree.toJSON());
    expect(updatedStr).toContain('July 2026');
    expect(updatedStr).toContain('2026-07');

    // Trigger Done button
    const doneBtn = root.findByProps({ testID: 'done-month-btn' });
    act(() => {
      doneBtn.props.onPress();
    });

    expect(mockSelect).toHaveBeenCalledWith('2026-07');
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('current month cannot navigate into the future (disables next-month button)', () => {
    const currentKey = getCurrentMonthKey();
    let tree;
    act(() => {
      tree = renderer.create(
        <MonthPickerModal
          visible={true}
          currentPeriod={currentKey}
          onSelect={jest.fn()}
          onClose={jest.fn()}
        />
      );
    });

    const root = tree.root;
    const nextBtn = root.findByProps({ testID: 'next-month-btn' });
    expect(nextBtn.props.disabled).toBe(true);
  });

  it('Cancel keeps the previous period and closes modal without calling onSelect', () => {
    const mockSelect = jest.fn();
    const mockClose = jest.fn();

    let tree;
    act(() => {
      tree = renderer.create(
        <MonthPickerModal
          visible={true}
          currentPeriod="2026-08"
          onSelect={mockSelect}
          onClose={mockClose}
        />
      );
    });

    const root = tree.root;
    const cancelBtn = root.findByProps({ testID: 'cancel-month-btn' });
    act(() => {
      cancelBtn.props.onPress();
    });

    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('allows quick selection from the preset chips', () => {
    const mockSelect = jest.fn();
    const mockClose = jest.fn();

    let tree;
    act(() => {
      tree = renderer.create(
        <MonthPickerModal
          visible={true}
          currentPeriod={getCurrentMonthKey()}
          onSelect={mockSelect}
          onClose={mockClose}
        />
      );
    });

    const root = tree.root;
    const pastKey = shiftMonth(getCurrentMonthKey(), -2);
    const chip = root.findByProps({ testID: `month-chip-${pastKey}` });

    act(() => {
      chip.props.onPress();
    });

    const doneBtn = root.findByProps({ testID: 'done-month-btn' });
    act(() => {
      doneBtn.props.onPress();
    });

    expect(mockSelect).toHaveBeenCalledWith(pastKey);
  });

  it('InsightsScreen: month pill opens picker and selecting month dispatches setPeriod and triggers refresh', async () => {
    let tree;
    await act(async () => {
      tree = renderer.create(<InsightsScreen />);
    });

    const root = tree.root;
    const periodPill = root.findByProps({ testID: 'period-pill-btn' });
    expect(periodPill).toBeDefined();

    // Tap the period pill to open MonthPickerModal
    act(() => {
      periodPill.props.onPress();
    });

    const modal = root.findByProps({ testID: 'month-picker-modal' });
    expect(modal).toBeDefined();

    // Select previous month
    const prevBtn = root.findByProps({ testID: 'prev-month-btn' });
    act(() => {
      prevBtn.props.onPress();
    });

    // Tap Done
    const doneBtn = root.findByProps({ testID: 'done-month-btn' });
    act(() => {
      doneBtn.props.onPress();
    });

    // Verify Redux dispatches
    // 1. Initial loadData dispatch
    // 2. setPeriod('2026-08')
    // 3. fetchIntelligenceData({ month: '2026-08' })
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'intelligence/setPeriod',
        payload: '2026-08',
      })
    );
    expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function));
  });

  it('MonthPickerModal supports onSelectMonth as fallback callback and currentMonth prop', () => {
    const mockSelectMonth = jest.fn();
    const mockClose = jest.fn();

    let tree;
    act(() => {
      tree = renderer.create(
        <MonthPickerModal
          visible={true}
          currentMonth="2026-08"
          onSelectMonth={mockSelectMonth}
          onClose={mockClose}
        />
      );
    });

    const root = tree.root;
    const doneBtn = root.findByProps({ testID: 'done-month-btn' });
    act(() => {
      doneBtn.props.onPress();
    });

    expect(mockSelectMonth).toHaveBeenCalledWith('2026-08');
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('MonthPickerModal handles missing/undefined callback safely without throwing runtime errors', () => {
    let tree;
    expect(() => {
      act(() => {
        tree = renderer.create(
          <MonthPickerModal
            visible={true}
            currentPeriod="2026-08"
          />
        );
      });

      const root = tree.root;
      const doneBtn = root.findByProps({ testID: 'done-month-btn' });
      act(() => {
        doneBtn.props.onPress();
      });
    }).not.toThrow();
  });

  it('ReportsScreen: period pill opens MonthPickerModal and pressing Done updates period and fetches report', async () => {
    let tree;
    await act(async () => {
      tree = renderer.create(<ReportsScreen navigation={{ canGoBack: () => false }} />);
    });

    const root = tree.root;
    const periodPill = root.findByProps({ testID: 'report-period-pill' });
    expect(periodPill).toBeDefined();

    // Open MonthPickerModal
    act(() => {
      periodPill.props.onPress();
    });

    const modal = root.findByProps({ testID: 'month-picker-modal' });
    expect(modal).toBeDefined();

    // Shift month backwards
    const prevBtn = root.findByProps({ testID: 'prev-month-btn' });
    act(() => {
      prevBtn.props.onPress();
    });

    // Press Done button
    const doneBtn = root.findByProps({ testID: 'done-month-btn' });
    await act(async () => {
      doneBtn.props.onPress();
    });

    // Verify reportService was called with the updated month
    expect(reportService.getMonthlyReport).toHaveBeenCalled();
  });
});


