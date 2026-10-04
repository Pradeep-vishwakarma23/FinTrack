import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchBankingIntelligence,
  fetchFinancialTrends,
  clearInsightError,
  setPeriod,
  setTrendsRange,
  getCurrentMonthKey
} from '../redux/slices/insightSlice'
import { setCopilotMonth, requestMetricExplanation } from '../redux/slices/copilotSlice'
import { formatCurrency } from '../utils/format'
import { generateGroundedRecommendations } from '../utils/groundedRecommendations'
import ForecastCard from '../components/insights/ForecastCard'
import BudgetRiskCard from '../components/insights/BudgetRiskCard'
import AnomalyList from '../components/insights/AnomalyList'
import MerchantLeaderboard from '../components/insights/MerchantLeaderboard'
import CategoryBudgetProgress from '../components/insights/CategoryBudgetProgress'
import TrendOverviewSection from '../components/insights/TrendOverviewSection'
import RecurringCommitmentsSection from '../components/insights/RecurringCommitmentsSection'
import ActionPlanSection from '../components/insights/ActionPlanSection'
import AIAdvisorPanel from '../components/insights/AIAdvisorPanel'
import ProactiveInsightBanner from '../components/copilot/ProactiveInsightBanner'
import { EditorialHero, FloatingCircle, DotGrid, CurvedLine } from '../components/common/DecorativeElements'
import {
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Zap,
  TrendingUp,
  Target,
  Coins,
  X
} from '../components/common/Icons'

function Insights() {
  const dispatch = useDispatch()
  const {
    summary,
    merchants,
    anomalies,
    forecast,
    subscriptions,
    subscriptionsSummary,
    subscriptionsLoading,
    trends,
    trendsRange,
    trendsLoading,
    period,
    intelligenceLoading,
    intelligenceError,
    error
  } = useSelector((state) => state.insights)

  const [selectedMonth, setSelectedMonth] = useState(period || getCurrentMonthKey())

  const loadAllData = (monthToLoad) => {
    const targetMonth = monthToLoad || selectedMonth
    dispatch(fetchBankingIntelligence({ month: targetMonth }))
    dispatch(fetchFinancialTrends({ range: trendsRange || '6m', referenceMonth: targetMonth }))
    dispatch(setCopilotMonth(targetMonth))
  }

  useEffect(() => {
    loadAllData(selectedMonth)
  }, [dispatch, selectedMonth])

  const handleMonthChange = (e) => {
    const newMonth = e.target.value
    setSelectedMonth(newMonth)
    dispatch(setPeriod(newMonth))
    dispatch(setCopilotMonth(newMonth))
  }

  const handleRangeChange = (newRange) => {
    dispatch(setTrendsRange(newRange))
    dispatch(fetchFinancialTrends({ range: newRange, referenceMonth: selectedMonth }))
  }

  const handleExplain = ({ contextType, itemData }) => {
    dispatch(requestMetricExplanation({ month: selectedMonth, contextType, itemData }))
  }

  const metrics = summary?.metrics || {}
  const categorySpending = summary?.categorySpending || []
  const activeForecast = forecast || summary?.forecast
  const isDeficit = metrics.isDeficit || (metrics.netSavings !== undefined && metrics.netSavings < 0)

  // Compute deterministic, data-grounded recommendations from Phase 6.1 intelligence data
  const recommendations = generateGroundedRecommendations({
    summary,
    anomalies,
    forecast: activeForecast,
    period: selectedMonth
  })

  return (
    <div className="space-y-10 pb-20 relative">
      <FloatingCircle size={32} className="absolute -top-6 right-1/4 animate-float-slow" />
      <CurvedLine className="-top-8 right-10 animate-float-reverse hidden lg:block" />
      <DotGrid rows={3} cols={6} className="absolute top-12 right-1/3 hidden xl:grid" />

      {/* 1. Editorial Hero Statement */}
      <EditorialHero
        kicker="BANKING INTELLIGENCE ENGINE"
        title={
          <span>
            YOUR MONEY <br />
            <span className="font-light italic text-slate-800">IS TELLING A STORY.</span>
          </span>
        }
        subtitle="Automated spending intelligence, multi-month directional trends, statistical anomalies, and predictive cash flow analytics."
      >
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="px-4 py-2 bg-white/90 border border-emerald-200/80 rounded-2xl text-xs font-mono font-bold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#35D6A2]"
          />
          <button
            onClick={() => loadAllData(selectedMonth)}
            disabled={intelligenceLoading}
            className="px-5 py-2.5 bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 font-bold text-xs rounded-2xl shadow-glow-mint transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <RefreshCw size={13} className={intelligenceLoading ? 'animate-spin' : ''} />
            <span>{intelligenceLoading ? 'Analyzing...' : 'Refresh'}</span>
          </button>
        </div>
      </EditorialHero>

      {/* Error Alert */}
      {(error || intelligenceError) && (
        <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{intelligenceError || error}</span>
          </div>
          <button onClick={() => dispatch(clearInsightError())} className="text-rose-600 font-bold hover:text-rose-900">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Proactive Financial Insights (Deterministic Banking Intelligence) */}
      <ProactiveInsightBanner month={selectedMonth} />

      {/* 2. Chapter 1: Financial Health Snapshot Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0A0E17] via-[#111A24] to-[#0A0E17] text-white shadow-2xl border border-emerald-950/80 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#35D6A2]">
                FINANCIAL HEALTH SNAPSHOT
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-3 py-0.5 rounded-full border ${
                  isDeficit
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-emerald-500/20 text-[#35D6A2] border-emerald-500/40 shadow-glow-mint'
                }`}
              >
                {isDeficit ? 'CASH DEFICIT' : 'POSITIVE CASH FLOW'}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleExplain({
                    contextType: 'savings_rate',
                    itemData: { savingsRate: metrics.savingsRate, netSavings: metrics.netSavings }
                  })
                }
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-3 py-1 rounded-xl transition"
                aria-label="Explain savings rate and cash flow"
              >
                <Sparkles size={12} className="text-[#35D6A2]" />
                <span>Explain</span>
              </button>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light font-mono mt-3 text-white tracking-tight">
              Net Savings: {formatCurrency(metrics.netSavings || 0)}
            </h2>
            <p className="text-xs text-slate-400 mt-1.5">
              Savings Rate:{' '}
              <span className={`font-mono font-bold ${isDeficit ? 'text-rose-400' : 'text-[#35D6A2]'}`}>
                {metrics.savingsRate !== undefined ? `${metrics.savingsRate}%` : '0%'}
              </span>{' '}
              of total recorded period earnings.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 border-t border-slate-800 lg:border-t-0 lg:border-l lg:border-slate-800 lg:pl-8 pt-6 lg:pt-0">
            <div>
              <p className="text-[11px] font-mono uppercase font-semibold text-slate-400 tracking-wider">Total Income</p>
              <p className="text-xl font-light font-mono text-[#35D6A2] mt-1">
                {formatCurrency(metrics.totalIncome || 0)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase font-semibold text-slate-400 tracking-wider">Total Expenses</p>
              <p className="text-xl font-light font-mono text-rose-400 mt-1">
                {formatCurrency(metrics.totalExpense || 0)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase font-semibold text-slate-400 tracking-wider">Transactions</p>
              <p className="text-xl font-light font-mono text-slate-200 mt-1">
                {metrics.transactionCount || 0} Entries
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary Intelligence Grid: Forecast & Risk */}
      <div className="grid gap-8 lg:grid-cols-2">
        <ForecastCard forecast={activeForecast} loading={intelligenceLoading} onExplain={handleExplain} />
        <BudgetRiskCard forecast={activeForecast} loading={intelligenceLoading} onExplain={handleExplain} />
      </div>

      {/* 4. Multi-Month Financial Trends ("SEE THE DIRECTION.") */}
      <TrendOverviewSection
        trends={trends}
        range={trendsRange}
        onRangeChange={handleRangeChange}
        loading={intelligenceLoading || trendsLoading}
        onExplain={() => handleExplain({ contextType: 'trends', itemData: trends })}
      />

      {/* 5. Recurring Subscriptions & Fixed Obligations */}
      <RecurringCommitmentsSection
        subscriptions={subscriptions}
        summary={subscriptionsSummary}
        loading={intelligenceLoading || subscriptionsLoading}
        onExplain={() => handleExplain({ contextType: 'subscriptions', itemData: { subscriptions, summary: subscriptionsSummary } })}
      />

      {/* 6. Anomalies & Merchant Leaderboard */}
      <div className="grid gap-8 lg:grid-cols-2">
        <AnomalyList anomalies={anomalies} loading={intelligenceLoading} onExplain={handleExplain} />
        <MerchantLeaderboard merchants={merchants} loading={intelligenceLoading} onExplain={handleExplain} />
      </div>

      {/* 7. Category Spending & Budget Limits */}
      <CategoryBudgetProgress categories={categorySpending} loading={intelligenceLoading} onExplain={handleExplain} />

      {/* 8. AI-Powered Financial Action Plans ("YOUR NEXT FINANCIAL MOVES.") */}
      <ActionPlanSection
        onExplainAction={(plan) =>
          handleExplain({
            contextType: 'action_plan',
            itemData: plan
          })
        }
      />

      {/* 9. Smart Financial Recommendations (Data-Grounded) */}
      <section className="slab-panel p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-emerald-100/80 pb-4">
          <div>
            <p className="editorial-kicker">SYNTHESIZED HEURISTICS</p>
            <h3 className="text-xl font-light text-slate-900 tracking-tight mt-0.5">Smart Financial Recommendations</h3>
            <p className="text-xs text-slate-500">Actionable advice grounded strictly in your selected month's confirmed ledger</p>
          </div>
          <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-xs inline-flex items-center gap-1.5">
            <Zap size={13} className="text-[#1A956C]" />
            <span>Data-Grounded</span>
          </span>
        </div>

        {intelligenceLoading && !summary ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-[#35D6A2] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm">Synthesizing insights and financial patterns...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No recommendations generated yet. Add transactions and budgets to receive insights.
          </div>
        ) : (
          <div className="space-y-3.5">
            {recommendations.map((rec, index) => {
              const RecIcon = index === 0 ? (isDeficit ? AlertTriangle : Sparkles) : index === 1 ? TrendingUp : index === 2 ? Target : Coins
              return (
                <div
                  key={index}
                  className="p-4 rounded-2xl border border-emerald-100/80 bg-white/70 hover:bg-white transition-all flex items-start gap-3.5 shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5">
                    <RecIcon size={16} />
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed font-medium">{rec}</p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 10. Real AI Financial Advisor Panel */}
      <AIAdvisorPanel selectedMonth={selectedMonth} />
    </div>
  )
}

export default Insights