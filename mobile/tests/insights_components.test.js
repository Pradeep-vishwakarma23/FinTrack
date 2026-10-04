import React from 'react';
import renderer, { act } from 'react-test-renderer';
import {
  FinancialHealthHero,
  ExpenseForecastCard,
  BudgetVelocityRiskCard,
  SpendingAnomaliesSection,
  TopMerchantsSection,
  CategoryUtilizationSection,
} from '../src/components/insights/index.js';

describe('FinTrack Mobile - Insights UI Components', () => {
  it('should render FinancialHealthHero with positive savings', () => {
    const mockMetrics = {
      totalIncome: 80000,
      totalExpense: 30000,
      netSavings: 50000,
      savingsRate: 62.5,
      isDeficit: false,
      transactionCount: 12,
    };

    let tree;
    act(() => {
      tree = renderer.create(<FinancialHealthHero metrics={mockMetrics} />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('FINANCIAL HEALTH SNAPSHOT');
    expect(str).toContain('HEALTHY SAVINGS');
    expect(str).toContain('50,000');
    expect(str).toContain('62.5');
    expect(str).toContain('12');
  });

  it('should render FinancialHealthHero with cash deficit', () => {
    const mockDeficit = {
      totalIncome: 20000,
      totalExpense: 35000,
      netSavings: -15000,
      savingsRate: 0,
      isDeficit: true,
      transactionCount: 5,
    };

    let tree;
    act(() => {
      tree = renderer.create(<FinancialHealthHero metrics={mockDeficit} />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('DEFICIT');
    expect(str).toContain('-15,000');
  });

  it('should render ExpenseForecastCard with projected expense and daily burn rate', () => {
    const mockForecast = {
      projectedExpense: 45000,
      dailyBurnRate: 1500,
      daysElapsed: 15,
      totalDaysInMonth: 30,
      confidence: 82,
      forecastMethod: 'Linear month-to-date run-rate',
    };

    let tree;
    act(() => {
      tree = renderer.create(<ExpenseForecastCard forecast={mockForecast} />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Expense Run-Rate Forecast');
    expect(str).toContain('45,000');
    expect(str).toContain('1,500');
    expect(str).toContain('82');
    expect(str).toContain('15');
    expect(str).toContain('30');
  });

  it('should render BudgetVelocityRiskCard in CRITICAL and SAFE states', () => {
    const criticalForecast = {
      monthlyBudget: 40000,
      budgetVelocity: 1.25,
      riskLevel: 'CRITICAL',
      riskDetails: {
        projectedUtilization: 125,
        message: 'Spending is projected to exceed budget by ₹10,000.',
      },
    };

    let tree;
    act(() => {
      tree = renderer.create(<BudgetVelocityRiskCard forecast={criticalForecast} />);
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('CRITICAL');
    expect(str).toContain('1.25');
    expect(str).toContain('40,000');
    expect(str).toContain('Spending is projected to exceed budget');

    const safeForecast = {
      monthlyBudget: 50000,
      budgetVelocity: 0.6,
      riskLevel: 'SAFE',
      riskDetails: {
        projectedUtilization: 60,
        message: 'Spending velocity is healthy.',
      },
    };

    act(() => {
      tree = renderer.create(<BudgetVelocityRiskCard forecast={safeForecast} />);
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('SAFE');
    expect(str).toContain('0.6');
  });

  it('should render SpendingAnomaliesSection with empty and detected states', () => {
    let tree;
    act(() => {
      tree = renderer.create(<SpendingAnomaliesSection anomalies={[]} />);
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('0 Detected');
    expect(str).toContain('No unusual spending detected');

    const mockAnomalies = [
      {
        transactionId: 'anom_1',
        title: 'Electronics Store',
        amount: 28000,
        category: 'Shopping',
        anomalyType: 'BUDGET_SHOCK',
        severity: 'HIGH',
        reason: 'Single purchase exceeds 40% of monthly budget.',
        transactionDate: '2026-03-15',
      },
    ];

    act(() => {
      tree = renderer.create(<SpendingAnomaliesSection anomalies={mockAnomalies} />);
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('1 Detected');
    expect(str).toContain('Electronics Store');
    expect(str).toContain('28,000');
    expect(str).toContain('BUDGET_SHOCK');
  });

  it('should render TopMerchantsSection with ranked merchant items', () => {
    const mockMerchants = [
      { merchant: 'Swiggy', totalSpend: 3600, count: 4, averageTicket: 900, percentage: 12.0 },
      { merchant: 'Amazon', totalSpend: 2400, count: 2, averageTicket: 1200, percentage: 8.0 },
    ];

    let tree;
    act(() => {
      tree = renderer.create(<TopMerchantsSection merchants={mockMerchants} />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Top Merchants & Payees');
    expect(str).toContain('Swiggy');
    expect(str).toContain('3,600');
    expect(str).toContain('Amazon');
    expect(str).toContain('2,400');
  });

  it('should render CategoryUtilizationSection with limits and over-budget state', () => {
    const mockCategories = [
      {
        category: 'Rent',
        amount: 18000,
        percentage: 60.0,
        count: 1,
        budgetLimit: 20000,
        budgetUtilization: 90.0,
        isOverBudget: false,
      },
      {
        category: 'Food',
        amount: 8500,
        percentage: 28.3,
        count: 5,
        budgetLimit: 6000,
        budgetUtilization: 141.7,
        isOverBudget: true,
      },
    ];

    let tree;
    act(() => {
      tree = renderer.create(<CategoryUtilizationSection categories={mockCategories} />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Rent');
    expect(str).toContain('18,000');
    expect(str).toContain('Food');
    expect(str).toContain('8,500');
    expect(str).toContain('OVER BUDGET');
  });
});
