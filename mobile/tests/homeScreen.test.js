import React from 'react';
import renderer, { act } from 'react-test-renderer';
import {
  MobileFinancialHero,
  FinancialSummaryCards,
  CategorySpendingSection,
  SpendingTrendSection,
  BudgetProgressSection,
  RecentTransactionsSection,
} from '../src/components/dashboard/index.js';

// Helper to collect all rendered text
const collectText = (node) => {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join(' ');
  if (node.children) return collectText(node.children);
  return '';
};

describe('FinTrack Mobile - Redesigned HomeScreen Dashboard Components', () => {
  describe('MobileFinancialHero', () => {
    it('renders greeting, user avatar initial, and period display', () => {
      const mockUser = { name: 'Pradeep Sharma', email: 'pradeep@example.com' };
      const onOpenMonthPicker = jest.fn();
      const onRefresh = jest.fn();
      const onAvatarPress = jest.fn();

      let tree;
      act(() => {
        tree = renderer.create(
          <MobileFinancialHero
            user={mockUser}
            period="2026-09"
            isRefreshing={false}
            onOpenMonthPicker={onOpenMonthPicker}
            onRefresh={onRefresh}
            onAvatarPress={onAvatarPress}
          />
        );
      });

      const root = tree.root;
      const text = collectText(tree.toJSON());

      expect(text).toContain('FINANCIAL OVERVIEW');
      expect(text).toContain('Pradeep');
      expect(text).toContain('Your money,');
      expect(text).toContain('understood.');
      expect(text).toContain('Sep 2026');

      // Avatar button trigger
      const avatarBtn = root.findByProps({ testID: 'home-avatar-btn' });
      act(() => {
        avatarBtn.props.onPress();
      });
      expect(onAvatarPress).toHaveBeenCalledTimes(1);

      // Period pill trigger
      const periodPill = root.findByProps({ testID: 'home-period-pill' });
      act(() => {
        periodPill.props.onPress();
      });
      expect(onOpenMonthPicker).toHaveBeenCalledTimes(1);

      // Refresh button trigger
      const refreshBtn = root.findByProps({ testID: 'home-refresh-btn' });
      act(() => {
        refreshBtn.props.onPress();
      });
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('FinancialSummaryCards', () => {
    it('renders positive surplus financial position with KPI subcards', () => {
      let tree;
      act(() => {
        tree = renderer.create(
          <FinancialSummaryCards
            totalIncome={80000}
            totalExpense={30000}
            savings={50000}
            savingsRate={62.5}
          />
        );
      });

      const root = tree.root;
      const text = collectText(tree.toJSON());

      expect(text).toContain('FINANCIAL POSITION');
      expect(text).toContain('Healthy Financial Balance');
      expect(text).toContain('Surplus Cash Flow');
      expect(text).toContain('80,000');
      expect(text).toContain('30,000');
      expect(text).toContain('50,000');
      expect(text).toContain('62.5%');

      // Verify KPI subcard testIDs exist
      expect(root.findByProps({ testID: 'financial-position-hero-card' })).toBeDefined();
      expect(root.findByProps({ testID: 'kpi-income-card' })).toBeDefined();
      expect(root.findByProps({ testID: 'kpi-expense-card' })).toBeDefined();
      expect(root.findByProps({ testID: 'kpi-savings-card' })).toBeDefined();
      expect(root.findByProps({ testID: 'kpi-savings-rate-card' })).toBeDefined();
    });

    it('renders cash deficit financial position cleanly', () => {
      let tree;
      act(() => {
        tree = renderer.create(
          <FinancialSummaryCards
            totalIncome={20000}
            totalExpense={35000}
            savings={-15000}
            savingsRate={-75}
          />
        );
      });

      const text = collectText(tree.toJSON());

      expect(text).toContain('Outflow Exceeds Inflow');
      expect(text).toContain('Deficit Alert');
      expect(text).toContain('-15,000');
      expect(text).toContain('-75%');
    });
  });

  describe('CategorySpendingSection', () => {
    it('renders category breakdown with progress bars and amounts', () => {
      const categories = [
        { category: 'Food', amount: 4500, percentage: 45 },
        { category: 'Shopping', amount: 5500, percentage: 55 },
      ];

      let tree;
      act(() => {
        tree = renderer.create(
          <CategorySpendingSection
            categoryBreakdown={categories}
            totalExpense={10000}
          />
        );
      });

      const text = collectText(tree.toJSON());
      expect(text).toContain('Category Spending');
      expect(text).toContain('Food');
      expect(text).toContain('4,500');
      expect(text).toContain('Shopping');
      expect(text).toContain('5,500');
    });

    it('renders empty state message when no categories exist', () => {
      let tree;
      act(() => {
        tree = renderer.create(
          <CategorySpendingSection categoryBreakdown={[]} totalExpense={0} />
        );
      });

      const text = collectText(tree.toJSON());
      expect(text).toContain('No expenses recorded yet');
    });
  });

  describe('SpendingTrendSection', () => {
    it('renders monthly trend bars and formatted month labels', () => {
      const trend = [
        { month: '2026-08', income: 50000, expense: 30000, savings: 20000 },
        { month: '2026-09', income: 55000, expense: 28000, savings: 27000 },
      ];

      let tree;
      act(() => {
        tree = renderer.create(<SpendingTrendSection monthlyTrend={trend} />);
      });

      const text = collectText(tree.toJSON());
      expect(text).toContain('Monthly Spending Trend');
      expect(text).toContain('Inflow');
      expect(text).toContain('Outflow');
      expect(text).toContain('Aug');
      expect(text).toContain('Sep');
    });
  });

  describe('BudgetProgressSection', () => {
    it('renders monthly budget progress bar and remaining balance', () => {
      let tree;
      act(() => {
        tree = renderer.create(
          <BudgetProgressSection
            monthlyBudget={40000}
            totalExpense={25000}
            budgetRemaining={15000}
            categoryBudgets={[]}
          />
        );
      });

      const text = collectText(tree.toJSON());
      expect(text).toContain('Budget & Limits');
      expect(text).toContain('63% Used');
      expect(text).toContain('25,000');
      expect(text).toContain('40,000');
      expect(text).toContain('15,000');
    });
  });

  describe('RecentTransactionsSection', () => {
    it('renders transaction item with formatted amounts and triggers onViewAllPress', () => {
      const txs = [
        {
          _id: 'tx_1',
          title: 'Apple Subscription',
          category: 'Bills',
          amount: 499,
          type: 'expense',
          transactionDate: '2026-09-12T10:00:00Z',
          source: 'notification',
        },
        {
          _id: 'tx_2',
          title: 'Consulting Payout',
          category: 'Salary',
          amount: 25000,
          type: 'income',
          transactionDate: '2026-09-14T12:00:00Z',
          source: 'manual',
        },
      ];

      const onViewAll = jest.fn();

      let tree;
      act(() => {
        tree = renderer.create(
          <RecentTransactionsSection
            transactions={txs}
            onViewAllPress={onViewAll}
          />
        );
      });

      const root = tree.root;
      const text = collectText(tree.toJSON());

      expect(text).toContain('Recent Activity');
      expect(text).toContain('Apple Subscription');
      expect(text).toContain('499');
      expect(text).toContain('Consulting Payout');
      expect(text).toContain('25,000');

      // View all button
      const viewAllBtn = root.findByProps({ testID: 'home-view-all-tx-btn' });
      act(() => {
        viewAllBtn.props.onPress();
      });
      expect(onViewAll).toHaveBeenCalledTimes(1);
    });
  });
});
