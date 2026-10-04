import React from 'react';
import renderer, { act } from 'react-test-renderer';
import actionPlanReducer, {
  setFilterPriority,
  setFilterStatus,
  clearActionPlanError,
  clearGenerateSummary,
  fetchActionPlans,
  generateActionPlans,
  completeActionPlan,
  dismissActionPlan,
  deleteActionPlan
} from '../src/store/slices/actionPlanSlice.js';
import actionPlanService from '../src/services/actionPlanService.js';
import api from '../src/services/api.js';
import { ActionPlanSection } from '../src/components/insights/index.js';

jest.mock('../src/services/api.js', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('FinTrack Mobile - Phase 7.5 Action Plans Service, Slice & UI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('actionPlanService API tests', () => {
    it('should call getActionPlans endpoint correctly', async () => {
      api.get.mockResolvedValueOnce({
        data: [
          {
            _id: 'plan_1',
            title: 'Reduce Dining Spending',
            actionType: 'REDUCE_CATEGORY',
            monthlyImpact: 400,
            priority: 'HIGH',
            status: 'ACTIVE'
          }
        ]
      });

      const res = await actionPlanService.getActionPlans({ status: 'ACTIVE' });
      expect(api.get).toHaveBeenCalledWith('/action-plans', { params: { status: 'ACTIVE' } });
      expect(res.data).toHaveLength(1);
      expect(res.data[0].title).toBe('Reduce Dining Spending');
    });

    it('should call generateActionPlans endpoint correctly', async () => {
      api.post.mockResolvedValueOnce({
        success: true,
        generated: [
          {
            _id: 'plan_gen_1',
            title: 'Mitigate Cash Deficit',
            actionType: 'INCREASE_SAVINGS',
            monthlyImpact: 1500,
            priority: 'HIGH'
          }
        ],
        skippedDuplicates: []
      });

      const res = await actionPlanService.generateActionPlans();
      expect(api.post).toHaveBeenCalledWith('/action-plans/generate');
      expect(res.success).toBe(true);
      expect(res.generated).toHaveLength(1);
    });

    it('should call completeActionPlan and dismissActionPlan', async () => {
      api.post.mockResolvedValueOnce({
        data: { _id: 'p1', status: 'COMPLETED' }
      });
      const resComplete = await actionPlanService.completeActionPlan('p1');
      expect(api.post).toHaveBeenCalledWith('/action-plans/p1/complete');
      expect(resComplete.data.status).toBe('COMPLETED');

      api.post.mockResolvedValueOnce({
        data: { _id: 'p1', status: 'DISMISSED' }
      });
      const resDismiss = await actionPlanService.dismissActionPlan('p1');
      expect(api.post).toHaveBeenCalledWith('/action-plans/p1/dismiss');
      expect(resDismiss.data.status).toBe('DISMISSED');
    });
  });

  describe('actionPlanSlice Reducer & Actions', () => {
    it('should update filters and clear errors', () => {
      let state = actionPlanReducer(undefined, setFilterPriority('High'));
      expect(state.filterPriority).toBe('High');

      state = actionPlanReducer(state, setFilterStatus('Completed'));
      expect(state.filterStatus).toBe('Completed');

      state = actionPlanReducer(
        { ...state, error: 'Err', actionError: 'ActionErr', generateSummary: { generatedCount: 1 } },
        clearActionPlanError()
      );
      expect(state.error).toBeNull();
      expect(state.actionError).toBeNull();

      state = actionPlanReducer(state, clearGenerateSummary());
      expect(state.generateSummary).toBeNull();
    });

    it('should handle fetchActionPlans.fulfilled', () => {
      const mockItems = [
        { _id: 'p1', title: 'Plan 1', monthlyImpact: 500, priority: 'HIGH', status: 'ACTIVE' },
        { _id: 'p2', title: 'Plan 2', monthlyImpact: 300, priority: 'MEDIUM', status: 'ACTIVE' }
      ];

      const state = actionPlanReducer(undefined, {
        type: fetchActionPlans.fulfilled.type,
        payload: { items: mockItems, isRefresh: false }
      });

      expect(state.isLoading).toBe(false);
      expect(state.items).toHaveLength(2);
      expect(state.error).toBeNull();
    });

    it('should handle generateActionPlans.fulfilled with deduplication', () => {
      const initialItems = [
        { _id: 'p1', title: 'Existing Plan', monthlyImpact: 200, status: 'ACTIVE' }
      ];
      const newItems = [
        { _id: 'p2', title: 'New Plan', monthlyImpact: 400, status: 'ACTIVE' },
        { _id: 'p1', title: 'Duplicate Plan', monthlyImpact: 200, status: 'ACTIVE' }
      ];

      const state = actionPlanReducer(
        { ...actionPlanReducer(undefined, { type: '@@INIT' }), items: initialItems, isGenerating: true },
        {
          type: generateActionPlans.fulfilled.type,
          payload: {
            success: true,
            generated: newItems,
            skippedDuplicates: [{ _id: 'p1' }],
            message: 'Evaluated intelligence'
          }
        }
      );

      expect(state.isGenerating).toBe(false);
      expect(state.generateSummary.generatedCount).toBe(2);
      expect(state.generateSummary.skippedCount).toBe(1);
      expect(state.items).toHaveLength(2);
      expect(state.items[0]._id).toBe('p2');
    });

    it('should handle completeActionPlan and dismissActionPlan', () => {
      const initialItems = [
        { _id: 'p1', title: 'Plan 1', status: 'ACTIVE' },
        { _id: 'p2', title: 'Plan 2', status: 'ACTIVE' }
      ];

      let state = actionPlanReducer(
        { ...actionPlanReducer(undefined, { type: '@@INIT' }), items: initialItems },
        {
          type: completeActionPlan.fulfilled.type,
          payload: { _id: 'p1', title: 'Plan 1', status: 'COMPLETED' },
          meta: { arg: 'p1' }
        }
      );
      expect(state.items[0].status).toBe('COMPLETED');
      expect(state.items[1].status).toBe('ACTIVE');

      state = actionPlanReducer(state, {
        type: dismissActionPlan.fulfilled.type,
        payload: { _id: 'p2', title: 'Plan 2', status: 'DISMISSED' },
        meta: { arg: 'p2' }
      });
      expect(state.items[1].status).toBe('DISMISSED');
    });
  });

  describe('ActionPlanSection Mobile Component', () => {
    it('should render empty state when no action plans exist', () => {
      const handleGenerate = jest.fn();

      let tree;
      act(() => {
        tree = renderer.create(
          <ActionPlanSection
            plans={[]}
            isLoading={false}
            isGenerating={false}
            onGenerate={handleGenerate}
            onExplain={jest.fn()}
          />
        );
      });

      const str = JSON.stringify(tree.toJSON());
      expect(str).toContain('Action Plans');
      expect(str).toContain('No Action Plans Yet');
      expect(str).toContain('Generate');
    });

    it('should render active action plans, priority badges, and potential impact', () => {
      const mockItems = [
        {
          _id: 'plan_101',
          title: 'Reduce Shopping Spending',
          description: 'Shopping spending reached ₹4,000 this month. Reduce by ₹500.',
          actionType: 'REDUCE_CATEGORY',
          category: 'Shopping',
          targetAmount: 500,
          monthlyImpact: 500,
          potentialSixMonthImpact: 3000,
          priority: 'HIGH',
          status: 'ACTIVE',
          rationale: 'Shopping expense grew 25% over previous month.'
        },
        {
          _id: 'plan_102',
          title: 'Review Netflix Subscription',
          description: 'Recurring cost increased from ₹649 to ₹749.',
          actionType: 'REDUCE_RECURRING',
          category: 'Entertainment',
          targetAmount: 100,
          monthlyImpact: 100,
          potentialSixMonthImpact: 600,
          priority: 'MEDIUM',
          status: 'ACTIVE',
          rationale: 'Price hike detected on subscription.'
        }
      ];

      const handleComplete = jest.fn();
      const handleDismiss = jest.fn();
      const handleExplain = jest.fn();

      let tree;
      act(() => {
        tree = renderer.create(
          <ActionPlanSection
            plans={mockItems}
            isLoading={false}
            isGenerating={false}
            onComplete={handleComplete}
            onDismiss={handleDismiss}
            onExplain={handleExplain}
          />
        );
      });

      const str = JSON.stringify(tree.toJSON());
      // Title and Description
      expect(str).toContain('Reduce Shopping Spending');
      expect(str).toContain('Review Netflix Subscription');
      // Badges
      expect(str).toContain('HIGH');
      expect(str).toContain('MEDIUM');
      // Amounts and impacts
      expect(str).toContain('500');
      expect(str).toContain('3,000');
      expect(str).toContain('600');
      // Rationale
      expect(str).toContain('Shopping expense grew 25%');
      // Action buttons
      expect(str).toContain('Complete');
      expect(str).toContain('Dismiss');
    });
  });
});
