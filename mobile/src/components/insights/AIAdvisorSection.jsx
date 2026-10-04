import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../Text.jsx';
import { Card } from '../Card.jsx';
import { colors, spacing, borderRadius } from '../../theme/index.js';
import { formatCurrency } from '../../utils/formatters.js';
import aiAdvisorService from '../../services/aiAdvisorService.js';

export const AIAdvisorSection = ({ period }) => {
  // Advice State
  const [adviceData, setAdviceData] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Query State
  const [question, setQuestion] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);

  // What-If State
  const [additionalIncome, setAdditionalIncome] = useState('500');
  const [categoryReductions, setCategoryReductions] = useState({
    Other: '20',
    Shopping: '10',
  });
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [whatIfError, setWhatIfError] = useState(null);

  const fetchAdvice = useCallback(async (monthToFetch) => {
    setIsLoading(true);
    setError(null);
    setQueryResult(null);
    setWhatIfResult(null);
    try {
      const res = await aiAdvisorService.getAdvice(monthToFetch);
      if (res && res.success) {
        setAdviceData(res.data);
        setProvider(res.provider);
      } else {
        setError(res?.message || 'Failed to load AI financial advice.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to load AI Advisor.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (period) {
      fetchAdvice(period);
    }
  }, [period, fetchAdvice]);

  // Handle Q&A Submit
  const handleQuerySubmit = async (customPrompt) => {
    const promptToSend = typeof customPrompt === 'string' ? customPrompt : question;
    if (!promptToSend || !promptToSend.trim()) return;

    setQueryLoading(true);
    setQueryError(null);
    try {
      const res = await aiAdvisorService.askQuestion(period, promptToSend.trim());
      if (res && res.success) {
        setQueryResult(res.data);
        if (typeof customPrompt === 'string') {
          setQuestion(customPrompt);
        }
      } else {
        setQueryError(res?.message || 'Failed to get answer from AI Advisor.');
      }
    } catch (err) {
      setQueryError(err?.response?.data?.message || err?.message || 'Error processing financial question.');
    } finally {
      setQueryLoading(false);
    }
  };

  // Handle What-If Simulation
  const handleWhatIfSubmit = async () => {
    setWhatIfLoading(true);
    setWhatIfError(null);

    const reductions = {};
    for (const [cat, pct] of Object.entries(categoryReductions)) {
      const num = Number(pct);
      if (!isNaN(num) && num > 0) {
        reductions[cat] = num;
      }
    }

    const scenario = {
      categoryReductions: reductions,
      additionalIncome: Math.max(0, Number(additionalIncome) || 0),
    };

    try {
      const res = await aiAdvisorService.runWhatIf(period, scenario);
      if (res && res.success) {
        setWhatIfResult(res.data);
      } else {
        setWhatIfError(res?.message || 'Failed to simulate scenario.');
      }
    } catch (err) {
      setWhatIfError(err?.response?.data?.message || err?.message || 'Error running what-if scenario.');
    } finally {
      setWhatIfLoading(false);
    }
  };

  const isEmptyMonth =
    adviceData &&
    adviceData.executiveSummary &&
    (adviceData.executiveSummary.includes('No confirmed transactions') ||
      adviceData.executiveSummary.includes('No ledger activity') ||
      adviceData.executiveSummary.includes('Please log or confirm transactions'));

  const suggestionChips = [
    'What is causing my deficit?',
    'Where am I spending the most?',
    'How can I improve my savings this month?',
  ];

  return (
    <Card style={styles.container} testID="ai-advisor-section">
      {/* 1. Header with Provider Indicator */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text variant="h3" color={colors.textPrimary} weight="bold">
            🤖 AI Financial Advisor
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            Executive insights for {period || 'Current Month'}
          </Text>
        </View>

        <View style={styles.providerBadge} testID="provider-badge">
          {provider === 'gemini' ? (
            <View style={styles.geminiBadge}>
              <View style={styles.activeDot} />
              <Text variant="caption" color={colors.primaryLight} weight="bold">
                Powered by Gemini ✨
              </Text>
            </View>
          ) : (
            <View style={styles.fallbackBadge}>
              <View style={styles.fallbackDot} />
              <Text variant="caption" color={colors.textMuted} weight="medium">
                Using FinTrack fallback intelligence
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorBox}>
          <Text variant="caption" color={colors.danger} weight="medium">
            ⚠️ {error}
          </Text>
          <TouchableOpacity onPress={() => fetchAdvice(period)} style={styles.retryBtn}>
            <Text variant="caption" color={colors.primaryLight} weight="bold">
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primaryLight} />
          <Text variant="caption" color={colors.textSecondary}>
            Generating grounded financial advice for {period}...
          </Text>
        </View>
      ) : isEmptyMonth ? (
        /* Empty Month State */
        <View style={styles.emptyContainer} testID="empty-month-container">
          <Text style={styles.emptyIcon}>📭</Text>
          <Text variant="bodySmall" color={colors.textPrimary} weight="bold">
            No Confirmed Financial Activity
          </Text>
          <Text variant="caption" color={colors.textMuted} style={styles.emptyText}>
            No confirmed financial activity is available for this month yet. Add or confirm transactions to receive AI advice.
          </Text>
        </View>
      ) : adviceData ? (
        /* Advice Content */
        <View style={styles.contentContainer} testID="advice-content">
          {/* Executive Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryBadgeRow}>
              <Text variant="caption" color={colors.primaryLight} weight="bold">
                CURRENT FINANCIAL POSITION
              </Text>
              <Text variant="caption" color={colors.textMuted}>
                Verified Facts
              </Text>
            </View>
            <Text variant="bodySmall" color={colors.textPrimary} style={styles.summaryText}>
              {adviceData.executiveSummary}
            </Text>
          </View>

          {/* Key Observations */}
          {adviceData.keyObservations && adviceData.keyObservations.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text variant="caption" color={colors.textSecondary} weight="bold" style={styles.blockTitle}>
                KEY OBSERVATIONS
              </Text>
              {adviceData.keyObservations.map((obs, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text color={colors.primaryLight} style={styles.bulletIcon}>
                    🔍
                  </Text>
                  <Text variant="caption" color={colors.textPrimary} style={styles.bulletText}>
                    {obs}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* AI Recommendations */}
          {adviceData.actionableRecommendations && adviceData.actionableRecommendations.length > 0 && (
            <View style={styles.recommendationsCard}>
              <Text variant="caption" color={colors.primaryLight} weight="bold" style={styles.blockTitle}>
                🎯 AI RECOMMENDATIONS
              </Text>
              {adviceData.actionableRecommendations.map((rec, idx) => (
                <View key={idx} style={styles.recItem}>
                  <Text color={colors.success} style={styles.checkIcon}>
                    ✓
                  </Text>
                  <Text variant="caption" color={colors.textPrimary} weight="medium" style={styles.bulletText}>
                    {rec}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Savings Potential */}
          {adviceData.savingsPotential && (
            <View style={styles.savingsCard}>
              <Text variant="caption" color={colors.success} weight="bold">
                💰 SAVINGS POTENTIAL & TARGETS
              </Text>
              <Text variant="caption" color={colors.textSecondary} style={styles.savingsText}>
                {adviceData.savingsPotential}
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {/* 2. Interactive Q&A Chat Section */}
      <View style={styles.qaSection} testID="qa-section">
        <Text variant="caption" color={colors.textSecondary} weight="bold" style={styles.blockTitle}>
          💬 ASK AI ABOUT {period || 'THIS MONTH'}
        </Text>

        {/* Suggestion Chips */}
        <View style={styles.chipsContainer}>
          {suggestionChips.map((chip, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.chipButton}
              onPress={() => handleQuerySubmit(chip)}
              activeOpacity={0.7}
              disabled={queryLoading}
            >
              <Text variant="caption" color={colors.textSecondary}>
                💡 {chip}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Query Input Form */}
        <View style={styles.queryInputRow}>
          <TextInput
            style={styles.queryInput}
            value={question}
            onChangeText={setQuestion}
            placeholder={`Ask about income or spending in ${period}...`}
            placeholderTextColor={colors.textMuted}
            editable={!queryLoading}
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.askBtn, (!question.trim() || queryLoading) && styles.disabledBtn]}
            onPress={() => handleQuerySubmit()}
            disabled={!question.trim() || queryLoading}
            activeOpacity={0.8}
            testID="ask-query-btn"
          >
            {queryLoading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <Text variant="caption" color={colors.textPrimary} weight="bold">
                Ask →
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {queryError && (
          <Text variant="caption" color={colors.danger} style={styles.errorText}>
            {queryError}
          </Text>
        )}

        {/* Grounded Query Answer Box */}
        {queryResult && (
          <View style={styles.answerBox} testID="query-answer-box">
            <View style={styles.answerHeader}>
              <Text variant="caption" color={colors.primaryLight} weight="bold">
                Grounded Financial Answer
              </Text>
              <Text variant="caption" color={colors.textMuted}>
                Verified Facts
              </Text>
            </View>
            <Text variant="caption" color={colors.textPrimary} style={styles.answerText}>
              {queryResult.answer}
            </Text>
          </View>
        )}
      </View>

      {/* 3. Deterministic What-If Scenario Section */}
      <View style={styles.whatIfSection} testID="what-if-section">
        <Text variant="caption" color={colors.textSecondary} weight="bold" style={styles.blockTitle}>
          🧮 WHAT-IF SCENARIO SIMULATOR
        </Text>
        <Text variant="caption" color={colors.textMuted} style={styles.whatIfSubtitle}>
          Adjust category spending reductions and additional income to simulate outcomes.
        </Text>

        {/* Inputs */}
        <View style={styles.whatIfControls}>
          <View style={styles.reductionRow}>
            <View style={styles.reductionItem}>
              <Text variant="caption" color={colors.textSecondary}>
                Other Cut (%)
              </Text>
              <TextInput
                style={styles.numberInput}
                keyboardType="numeric"
                value={categoryReductions.Other || '0'}
                onChangeText={(val) => setCategoryReductions((p) => ({ ...p, Other: val }))}
              />
            </View>
            <View style={styles.reductionItem}>
              <Text variant="caption" color={colors.textSecondary}>
                Shopping Cut (%)
              </Text>
              <TextInput
                style={styles.numberInput}
                keyboardType="numeric"
                value={categoryReductions.Shopping || '0'}
                onChangeText={(val) => setCategoryReductions((p) => ({ ...p, Shopping: val }))}
              />
            </View>
            <View style={styles.reductionItem}>
              <Text variant="caption" color={colors.textSecondary}>
                Add Income (₹)
              </Text>
              <TextInput
                style={styles.numberInput}
                keyboardType="numeric"
                value={additionalIncome}
                onChangeText={setAdditionalIncome}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.simulateBtn, whatIfLoading && styles.disabledBtn]}
            onPress={handleWhatIfSubmit}
            disabled={whatIfLoading}
            activeOpacity={0.8}
            testID="run-what-if-btn"
          >
            {whatIfLoading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <Text variant="caption" color={colors.textPrimary} weight="bold">
                ⚡ Simulate Scenario
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {whatIfError && (
          <Text variant="caption" color={colors.danger} style={styles.errorText}>
            {whatIfError}
          </Text>
        )}

        {/* What-If Results */}
        {whatIfResult && (
          <View style={styles.whatIfResultContainer} testID="what-if-results">
            {whatIfResult.narrative ? (
              <View style={styles.narrativeBox}>
                <Text variant="caption" color={colors.primaryLight} weight="medium">
                  💡 {whatIfResult.narrative}
                </Text>
              </View>
            ) : null}

            {/* Baseline vs Simulated Comparison */}
            <View style={styles.compareGrid}>
              <View style={styles.compareCard}>
                <Text variant="caption" color={colors.textMuted} weight="bold">
                  BASELINE
                </Text>
                <Text variant="caption" color={colors.textPrimary}>
                  Exp: {formatCurrency(whatIfResult.baseline.expense)}
                </Text>
                <Text
                  variant="caption"
                  color={whatIfResult.baseline.netSavings >= 0 ? colors.success : colors.danger}
                  weight="bold"
                >
                  Net: {formatCurrency(whatIfResult.baseline.netSavings)}
                </Text>
              </View>

              <View style={[styles.compareCard, styles.simulatedCard]}>
                <Text variant="caption" color={colors.primaryLight} weight="bold">
                  SIMULATED
                </Text>
                <Text variant="caption" color={colors.textPrimary}>
                  Exp: {formatCurrency(whatIfResult.simulated.expense)}
                </Text>
                <Text
                  variant="caption"
                  color={whatIfResult.simulated.netSavings >= 0 ? colors.success : colors.danger}
                  weight="bold"
                >
                  Net: {formatCurrency(whatIfResult.simulated.netSavings)}
                </Text>
              </View>
            </View>

            {/* Difference Breakdown */}
            <View style={styles.diffCard}>
              <Text variant="caption" color={colors.success} weight="bold">
                GAINS: +{formatCurrency(whatIfResult.difference.improvedSavings)} Total Savings Improvement
              </Text>
              <Text variant="caption" color={colors.textMuted}>
                (Expense Cut: +{formatCurrency(whatIfResult.difference.savedExpense)}, Extra Income: +{formatCurrency(whatIfResult.difference.additionalIncome)})
              </Text>
            </View>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'column',
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    gap: 2,
  },
  providerBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  geminiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mintBg,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.mintBorder,
    gap: 6,
  },
  fallbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  fallbackDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },
  errorBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  retryBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  contentContainer: {
    gap: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: spacing.xs,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    lineHeight: 20,
  },
  sectionBlock: {
    gap: spacing.xs,
  },
  blockTitle: {
    letterSpacing: 0.5,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  bulletIcon: {
    fontSize: 12,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    lineHeight: 18,
  },
  recommendationsCard: {
    backgroundColor: colors.mintBg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.mintBorder,
    gap: spacing.xs,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 1,
  },
  savingsCard: {
    backgroundColor: colors.successBg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.successBorder,
    gap: 4,
  },
  savingsText: {
    lineHeight: 18,
  },
  qaSection: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chipButton: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  queryInputRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  queryInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.textPrimary,
    fontSize: 12,
  },
  askBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  errorText: {
    marginTop: 2,
  },
  answerBox: {
    backgroundColor: colors.mintBg,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.mintBorder,
    gap: 4,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answerText: {
    lineHeight: 18,
  },
  whatIfSection: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  whatIfSubtitle: {
    fontSize: 11,
  },
  whatIfControls: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  reductionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  reductionItem: {
    flex: 1,
    gap: 2,
  },
  numberInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    color: colors.textPrimary,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  simulateBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  whatIfResultContainer: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  narrativeBox: {
    backgroundColor: colors.mintBg,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.mintBorder,
  },
  compareGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  compareCard: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 2,
  },
  simulatedCard: {
    borderColor: colors.mintBorder,
    backgroundColor: colors.mintBg,
  },
  diffCard: {
    backgroundColor: colors.successBg,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.successBorder,
    gap: 2,
  },
});

export default AIAdvisorSection;
