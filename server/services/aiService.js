import OpenAI from 'openai';
import { analyzeFinance } from './financeAnalyzer.js';

export const hasOpenAIKey = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return trimmed.length > 20 && trimmed.startsWith('sk-') && !trimmed.includes('your_api_key_here');
};

export const generateAIInsights = async ({ transactions = [], budget = null }) => {
  const analysis = analyzeFinance({ transactions, budget });

  if (!hasOpenAIKey()) {
    return {
      provider: 'heuristic',
      insights: [...analysis.insights, ...analysis.recommendations].slice(0, 8),
      analysis
    };
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const prompt = `You are an expert financial advisor for personal finance management.
Here is the user's financial summary in JSON:
${JSON.stringify(
  {
    totalIncome: analysis.totalIncome,
    totalExpense: analysis.totalExpense,
    savings: analysis.savings,
    monthlyBudget: analysis.monthlyBudget,
    budgetRemaining: analysis.budgetRemaining,
    categoryBreakdown: analysis.categoryBreakdown,
    monthlyTrend: analysis.monthlyTrend
  },
  null,
  2
)}

Provide 4 to 6 concise, actionable, and encouraging personal finance insights and recommendations in bullet points.
Return ONLY a valid JSON array of strings, for example: ["Insight 1", "Insight 2", "Insight 3"]. Do not wrap in markdown code blocks or add explanatory text.`;

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional financial assistant that replies strictly with a JSON array of strings.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4
    });

    const content = response.choices[0]?.message?.content?.trim() || '';
    let parsedInsights = [];

    try {
      const cleanContent = content.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
      parsedInsights = JSON.parse(cleanContent);
    } catch (parseErr) {
      parsedInsights = content
        .split('\n')
        .map((line) => line.replace(/^[-*0-9.]+\s*/, '').trim())
        .filter((line) => line.length > 0);
    }

    if (Array.isArray(parsedInsights) && parsedInsights.length > 0) {
      return {
        provider: 'openai',
        insights: parsedInsights,
        analysis
      };
    }

    return {
      provider: 'heuristic',
      insights: [...analysis.insights, ...analysis.recommendations].slice(0, 8),
      analysis
    };
  } catch (error) {
    console.warn('OpenAI insight generation failed, falling back to heuristic engine:', error.message);
    return {
      provider: 'heuristic',
      insights: [...analysis.insights, ...analysis.recommendations].slice(0, 8),
      analysis
    };
  }
};

export const predictExpense = async ({ transactions = [], budget = null }) => {
  const analysis = analyzeFinance({ transactions, budget });
  const monthlyBudget = Number(budget?.monthlyBudget || 0);
  const predictedExpense = analysis.predictedExpense;
  const confidence = analysis.confidence;
  const budgetRisk = monthlyBudget > 0 ? predictedExpense > monthlyBudget : false;

  return {
    predictedExpense,
    confidence,
    monthlyBudget,
    budgetRisk,
    recommendations: analysis.recommendations,
    methodology: 'Historical monthly expense moving average with confidence weighting'
  };
};