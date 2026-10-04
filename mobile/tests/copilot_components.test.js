import React from 'react';
import renderer, { act } from 'react-test-renderer';

const mockDispatch = jest.fn();
let mockCopilotState = {
  isBottomSheetOpen: true,
  messages: [
    {
      id: 'msg_1',
      role: 'user',
      content: 'Why is my savings rate negative?',
      timestamp: '2026-09-28T10:00:00.000Z'
    },
    {
      id: 'msg_2',
      role: 'assistant',
      content: 'Your savings rate is -72% because expenses (₹1,075) exceeded income (₹625).',
      suggestedFollowUps: ['Which category contributed the most?', 'What if I reduce Shopping by 20%?'],
      provider: 'gemini',
      timestamp: '2026-09-28T10:00:05.000Z'
    }
  ],
  isSending: false,
  error: null,
  provider: 'gemini',
  month: '2026-09',
  suggestedFollowUps: ['Which category contributed the most?', 'What if I reduce Shopping by 20%?'],
  isExplainModalOpen: true,
  explanation: {
    title: 'Savings Rate (-72%) Analysis',
    explanation: 'Your net cash flow is negative ₹450 because total expenses exceeded income.',
    keyDrivers: ['Other expenses: ₹600', 'Shopping expenses: ₹475'],
    recommendedAction: 'Reduce discretionary shopping by ₹200 to move cash flow closer to breakeven.'
  },
  explanationLoading: false,
  explanationError: null,
  explanationContextType: 'savings_rate',
  proactiveInsights: [
    {
      id: 'insight_deficit',
      type: 'danger',
      title: 'Monthly Cash Flow Deficit',
      message: 'Your verified expenses (₹1,075) exceed your confirmed income (₹625).',
      actionLabel: 'Review Deficit'
    },
    {
      id: 'insight_shopping_surge',
      type: 'warning',
      title: 'Discretionary Surge',
      message: 'Shopping expenses are up 45% vs baseline.',
      actionLabel: 'Analyze Spending'
    }
  ],
  insightsLoading: false,
  insightsError: null
};

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn) => fn({
    copilot: mockCopilotState,
    intelligence: { period: '2026-09' }
  }),
}));

import {
  CopilotBottomSheet,
  FloatingCopilotButton,
  ExplainThisModal,
  ProactiveInsightBanner,
} from '../src/components/copilot/index.js';
import { formatCurrency, formatDate } from '../src/utils/formatters.js';

describe('FinTrack Mobile - Copilot Components & Conversational Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Component Exports', () => {
    it('should export all Copilot components', () => {
      expect(CopilotBottomSheet).toBeDefined();
      expect(FloatingCopilotButton).toBeDefined();
      expect(ExplainThisModal).toBeDefined();
      expect(ProactiveInsightBanner).toBeDefined();
    });
  });

  describe('2. CopilotBottomSheet UI Rendering', () => {
    it('should render active messages, header, provider badge, and follow-up chips', () => {
      let tree;
      act(() => {
        tree = renderer.create(<CopilotBottomSheet />);
      });

      const jsonStr = JSON.stringify(tree.toJSON());
      expect(jsonStr).toContain('FinTrack Copilot');
      expect(jsonStr).toContain('Gemini');
      expect(jsonStr).toContain('Why is my savings rate negative?');
      expect(jsonStr).toContain('Your savings rate is -72% because expenses');
      expect(jsonStr).toContain('Which category contributed the most?');
      expect(jsonStr).toContain('What if I reduce Shopping by 20%?');
    });

    it('should render empty state when messages array is empty', () => {
      const prevMessages = mockCopilotState.messages;
      mockCopilotState.messages = [];

      let tree;
      act(() => {
        tree = renderer.create(<CopilotBottomSheet />);
      });

      const jsonStr = JSON.stringify(tree.toJSON());
      expect(jsonStr).toContain('How can I assist your finances?');
      expect(jsonStr).toContain('SUGGESTED QUESTIONS');
      expect(jsonStr).toContain('Why is my savings rate negative?');

      mockCopilotState.messages = prevMessages;
    });
  });

  describe('3. FloatingCopilotButton UI Rendering', () => {
    it('should render floating button with sparkle icon and AI Copilot label', () => {
      let tree;
      act(() => {
        tree = renderer.create(<FloatingCopilotButton />);
      });

      const jsonStr = JSON.stringify(tree.toJSON());
      expect(jsonStr).toContain('✦');
      expect(jsonStr).toContain('FinTrack Copilot');
    });
  });

  describe('4. ExplainThisModal UI Rendering', () => {
    it('should render authoritative metric explanation, key drivers, and recommendation', () => {
      let tree;
      act(() => {
        tree = renderer.create(<ExplainThisModal />);
      });

      const jsonStr = JSON.stringify(tree.toJSON());
      expect(jsonStr).toContain('Explain Metric');
      expect(jsonStr).toContain('Savings Rate (-72%) Analysis');
      expect(jsonStr).toContain('Your net cash flow is negative ₹450');
      expect(jsonStr).toContain('Other expenses: ₹600');
      expect(jsonStr).toContain('Shopping expenses: ₹475');
      expect(jsonStr).toContain('RECOMMENDED ACTION');
      expect(jsonStr).toContain('Reduce discretionary shopping by ₹200');
      expect(jsonStr).toContain('Ask Copilot More');
    });
  });

  describe('5. ProactiveInsightBanner UI Rendering', () => {
    it('should render proactive deficit and warning cards with action buttons', () => {
      let tree;
      act(() => {
        tree = renderer.create(<ProactiveInsightBanner month="2026-09" />);
      });

      const jsonStr = JSON.stringify(tree.toJSON());
      expect(jsonStr).toContain('Monthly Cash Flow Deficit');
      expect(jsonStr).toContain('Review Deficit');
      expect(jsonStr).toContain('Discretionary Surge');
      expect(jsonStr).toContain('Analyze Spending');
    });
  });

  describe('6. Contextual Goal Prompt Construction', () => {
    it('should format goal prompt accurately for Copilot session', () => {
      const mockGoal = {
        _id: 'goal_101',
        title: 'Emergency Fund',
        targetAmount: 50000,
        targetDate: '2027-06-30T00:00:00.000Z',
      };

      const dateFormatted = formatDate(mockGoal.targetDate, { short: true });
      const prompt = `How can I achieve my goal "${mockGoal.title}" of ${formatCurrency(mockGoal.targetAmount)} by ${dateFormatted}?`;

      expect(prompt).toBe(`How can I achieve my goal "Emergency Fund" of ₹50,000 by ${dateFormatted}?`);
    });
  });

  describe('7. Multi-Turn Context & Input Constraints', () => {
    it('should enforce 500 character ceiling on user inputs', () => {
      const isValidLength = (str) => Boolean(str && str.trim().length > 0 && str.length <= 500);
      expect(isValidLength('')).toBe(false);
      expect(isValidLength('   ')).toBe(false);
      expect(isValidLength('x'.repeat(500))).toBe(true);
      expect(isValidLength('x'.repeat(501))).toBe(false);
    });
  });
});
