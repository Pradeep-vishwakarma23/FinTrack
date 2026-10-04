import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AIAdvisorSection } from '../src/components/insights/AIAdvisorSection.jsx';
import aiAdvisorService from '../src/services/aiAdvisorService.js';

jest.mock('../src/services/aiAdvisorService.js', () => ({
  __esModule: true,
  default: {
    getAdvice: jest.fn(),
    askQuestion: jest.fn(),
    runWhatIf: jest.fn(),
  },
}));

describe('FinTrack Mobile - AIAdvisorSection UI Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render AIAdvisorSection with Gemini provider and advice content', async () => {
    const mockAdvice = {
      success: true,
      provider: 'gemini',
      period: '2026-09',
      data: {
        executiveSummary: 'Net cash surplus of ₹15,000 for 2026-09.',
        keyObservations: ['Top category is Rent at ₹18,000', 'No anomalies detected'],
        actionableRecommendations: ['Invest surplus in mutual funds'],
        savingsPotential: 'Trimming dining out could save ₹2,000.',
      },
    };

    aiAdvisorService.getAdvice.mockResolvedValueOnce(mockAdvice);

    let tree;
    await act(async () => {
      tree = renderer.create(<AIAdvisorSection period="2026-09" />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('AI Financial Advisor');
    expect(str).toContain('Powered by Gemini');
    expect(str).toContain('Net cash surplus of ₹15,000');
    expect(str).toContain('Top category is Rent at ₹18,000');
    expect(str).toContain('Invest surplus in mutual funds');
    expect(str).toContain('Trimming dining out could save ₹2,000');
  });

  it('should render AIAdvisorSection with Heuristic fallback indicator', async () => {
    const mockFallback = {
      success: true,
      provider: 'heuristic',
      period: '2026-09',
      data: {
        executiveSummary: 'Positive finances with net savings.',
        keyObservations: ['Spending patterns remain consistent'],
        actionableRecommendations: ['Maintain emergency fund'],
        savingsPotential: 'Maintain current spending habits.',
      },
    };

    aiAdvisorService.getAdvice.mockResolvedValueOnce(mockFallback);

    let tree;
    await act(async () => {
      tree = renderer.create(<AIAdvisorSection period="2026-09" />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Using FinTrack fallback intelligence');
    expect(str).toContain('Positive finances with net savings');
  });

  it('should render empty month message when transactions are zero', async () => {
    const mockEmpty = {
      success: true,
      provider: 'heuristic',
      period: '2026-08',
      data: {
        executiveSummary: 'No confirmed transactions were recorded for 2026-08. Please log or confirm transactions.',
        keyObservations: ['No ledger activity detected for the selected period.'],
        actionableRecommendations: ['Add your income and daily expenses.'],
        savingsPotential: 'No data available to calculate potential savings.',
      },
    };

    aiAdvisorService.getAdvice.mockResolvedValueOnce(mockEmpty);

    let tree;
    await act(async () => {
      tree = renderer.create(<AIAdvisorSection period="2026-08" />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('No Confirmed Financial Activity');
    expect(str).toContain('No confirmed financial activity is available for this month yet');
  });

  it('should render What-If and Q&A elements correctly', async () => {
    const mockAdvice = {
      success: true,
      provider: 'gemini',
      period: '2026-09',
      data: {
        executiveSummary: 'Finances stable.',
        keyObservations: [],
        actionableRecommendations: [],
        savingsPotential: 'Good rate',
      },
    };

    aiAdvisorService.getAdvice.mockResolvedValueOnce(mockAdvice);

    let tree;
    await act(async () => {
      tree = renderer.create(<AIAdvisorSection period="2026-09" />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('ASK AI ABOUT');
    expect(str).toContain('2026-09');
    expect(str).toContain('WHAT-IF SCENARIO SIMULATOR');
    expect(str).toContain('Other Cut (%)');
    expect(str).toContain('Shopping Cut (%)');
    expect(str).toContain('Add Income (₹)');
    expect(str).toContain('Simulate Scenario');
  });
});
