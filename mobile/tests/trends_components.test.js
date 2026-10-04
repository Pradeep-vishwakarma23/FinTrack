import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TrendOverviewSection } from '../src/components/insights/index.js';

describe('FinTrack Mobile - TrendOverviewSection Component', () => {
  it('should render gracefully with empty or default trends data', () => {
    let tree;
    act(() => {
      tree = renderer.create(
        <TrendOverviewSection
          trends={null}
          range="6m"
          onRangeChange={jest.fn()}
          onExplain={jest.fn()}
        />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Financial Trends');
    expect(str).toContain('6M');
    expect(str).toContain('12M');
    expect(str).toContain('INSUFFICIENT_DATA');
  });

  it('should render comprehensive multi-month trend metrics, momentum, and bars', () => {
    const mockTrends = {
      period: '2026-09',
      range: '6m',
      months: [
        { month: '2026-04', income: 8000, expenses: 3000, netSavings: 5000, savingsRate: 62.5 },
        { month: '2026-05', income: 8500, expenses: 3200, netSavings: 5300, savingsRate: 62.35 },
        { month: '2026-06', income: 9000, expenses: 3100, netSavings: 5900, savingsRate: 65.56 },
        { month: '2026-07', income: 9000, expenses: 3400, netSavings: 5600, savingsRate: 62.22 },
        { month: '2026-08', income: 10000, expenses: 3500, netSavings: 6500, savingsRate: 65.0 },
        { month: '2026-09', income: 12000, expenses: 4000, netSavings: 8000, savingsRate: 66.67 }
      ],
      comparison: {
        income: { current: 12000, previous: 10000, change: 2000, percentageChange: 20.0 },
        expenses: { current: 4000, previous: 3500, change: 500, percentageChange: 14.29 },
        savings: { current: 8000, previous: 6500, change: 1500, percentageChange: 23.08 }
      },
      momentum: {
        state: 'IMPROVING',
        savingsSlope: 500,
        averageSavingsRate: 64.05
      },
      categories: [
        { category: 'Dining Out', totalSpending: 1200, averageMonthlySpending: 200, trend: 'increasing', change: 150 },
        { category: 'Groceries', totalSpending: 6000, averageMonthlySpending: 1000, trend: 'stable', change: 20 },
        { category: 'Utilities', totalSpending: 1800, averageMonthlySpending: 300, trend: 'decreasing', change: -50 }
      ],
      extremes: {
        highestExpenseMonth: { month: '2026-09', amount: 4000 },
        lowestExpenseMonth: { month: '2026-04', amount: 3000 },
        highestIncomeMonth: { month: '2026-09', amount: 12000 },
        highestSavingsMonth: { month: '2026-09', amount: 8000 }
      }
    };

    const handleRangeChange = jest.fn();
    const handleExplain = jest.fn();

    let tree;
    act(() => {
      tree = renderer.create(
        <TrendOverviewSection
          trends={mockTrends}
          range="6m"
          onRangeChange={handleRangeChange}
          onExplain={handleExplain}
        />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    // MoM metrics
    expect(str).toContain('MoM Income');
    expect(str).toContain('12,000');
    expect(str).toContain('20');

    expect(str).toContain('MoM Expenses');
    expect(str).toContain('4,000');
    expect(str).toContain('14.29');

    expect(str).toContain('MoM Net Savings');
    expect(str).toContain('8,000');

    // Momentum badge
    expect(str).toContain('IMPROVING');

    // Category shifts
    expect(str).toContain('Dining Out');
    expect(str).toContain('increasing');
    expect(str).toContain('Groceries');
    expect(str).toContain('Utilities');

    // Extremes
    expect(str).toContain('Peak Spending');
    expect(str).toContain('Peak Savings');
    expect(str).toContain('2026-09');
  });

  it('should handle range switching buttons', () => {
    const handleRangeChange = jest.fn();

    let tree;
    act(() => {
      tree = renderer.create(
        <TrendOverviewSection
          trends={{ months: [] }}
          range="6m"
          onRangeChange={handleRangeChange}
        />
      );
    });

    const root = tree.root;
    const btn12m = root.findByProps({ testID: 'mobile-range-btn-12m' });
    const btn6m = root.findByProps({ testID: 'mobile-range-btn-6m' });

    act(() => {
      btn12m.props.onPress();
    });
    expect(handleRangeChange).toHaveBeenCalledWith('12m');

    act(() => {
      btn6m.props.onPress();
    });
    expect(handleRangeChange).toHaveBeenCalledWith('6m');
  });
});
