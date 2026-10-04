import React, { useEffect, useState } from 'react'
import { getDashboardSummary } from '../services/dashboardService'
import { formatCurrency } from '../utils/format'
import { getCurrentMonthKey } from '../redux/slices/insightSlice'
import ProactiveInsightBanner from '../components/copilot/ProactiveInsightBanner'
import { FloatingCircle, DotGrid, CurvedLine } from '../components/common/DecorativeElements'
import { useScrollReveal } from '../hooks/useScrollReveal'
import FinancialHero from '../components/dashboard/FinancialHero'
import FinancialPositionCard from '../components/dashboard/FinancialPositionCard'
import SummaryCard from '../components/dashboard/SummaryCard'
import SpendingOverview from '../components/dashboard/SpendingOverview'
import MonthlyTrendSection from '../components/dashboard/MonthlyTrendSection'
import RecentActivity from '../components/dashboard/RecentActivity'
import {
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Coins,
  ArrowLeftRight,
  PieChartIcon,
  Sparkles
} from '../components/common/Icons'

function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey())
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [chartsRef, chartsVisible] = useScrollReveal({ threshold: 0.1, triggerOnce: true })
  const [lowerRef, lowerVisible] = useScrollReveal({ threshold: 0.1, triggerOnce: true })

  const fetchSummary = async (monthKey) => {
    try {
      setLoading(true)
      setError('')
      const targetMonth = monthKey || selectedMonth
      const response = await getDashboardSummary(targetMonth)
      setSummary(response.data?.data || response.data || null)
    } catch (err) {
      console.error('[Dashboard] Error fetching summary:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load financial dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary(selectedMonth)
  }, [selectedMonth])

  const handleMonthChange = (newMonth) => {
    if (newMonth && newMonth !== selectedMonth) {
      setSelectedMonth(newMonth)
    }
  }

  const handleRefresh = () => {
    fetchSummary(selectedMonth)
  }

  // Skeleton Loading State
  if (loading && !summary) {
    return (
      <div className="space-y-8 animate-pulse pb-16">
        {/* Skeleton Hero */}
        <div className="space-y-3 pt-2">
          <div className="h-6 w-44 bg-emerald-100/60 rounded-full" />
          <div className="h-12 w-full max-w-xl bg-emerald-100/80 rounded-2xl" />
          <div className="h-4 w-2/3 max-w-md bg-emerald-100/50 rounded-xl" />
        </div>

        {/* Skeleton Top Grid */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="h-64 bg-white/70 rounded-3xl lg:col-span-2 border border-emerald-100" />
          <div className="h-64 bg-white/70 rounded-3xl border border-emerald-100" />
        </div>

        {/* Skeleton KPI Row */}
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="h-36 bg-white/70 rounded-3xl border border-emerald-100" />
          <div className="h-36 bg-white/70 rounded-3xl border border-emerald-100" />
          <div className="h-36 bg-white/70 rounded-3xl border border-emerald-100" />
        </div>

        {/* Skeleton Charts */}
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="h-80 bg-white/70 rounded-3xl xl:col-span-2 border border-emerald-100" />
          <div className="h-80 bg-white/70 rounded-3xl border border-emerald-100" />
        </div>
      </div>
    )
  }

  // Error State
  if (error && !summary) {
    return (
      <div className="p-8 rounded-3xl bg-rose-50/80 border border-rose-200 text-rose-900 shadow-card-slab max-w-2xl my-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Unable to Load Financial Dashboard</h3>
            <p className="text-sm mt-1 text-rose-700">{error}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="mt-5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-2xl text-xs font-semibold shadow-sm transition flex items-center gap-2"
        >
          <RefreshCw size={14} />
          <span>Retry Loading</span>
        </button>
      </div>
    )
  }

  const trend = summary?.monthlyTrend || []
  const categories = summary?.categoryBreakdown || []
  const recent = summary?.recentTransactions || []

  return (
    <div className="space-y-8 pb-16 relative">
      {/* Ambient Floating Accents */}
      <FloatingCircle size={28} className="absolute -top-6 right-1/4 animate-float-slow" />
      <CurvedLine className="-top-10 right-4 animate-float-reverse hidden lg:block" />
      <DotGrid rows={3} cols={5} className="absolute top-12 right-1/3 hidden xl:grid" />

      {/* 1. Hero Editorial Section */}
      <FinancialHero
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* 2. Proactive AI Intelligence Banner */}
      <ProactiveInsightBanner month={selectedMonth} />

      {/* 3. Primary Financial Position & KPI Orbit */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Large Financial Position Card */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <FinancialPositionCard
            income={summary?.totalIncome || 0}
            expense={summary?.totalExpense || 0}
            savings={summary?.savings || 0}
            savingsRate={summary?.savingsRate}
            budgetRemaining={summary?.budgetRemaining || 0}
          />
        </div>

        {/* Supporting KPI Stack */}
        <div className="lg:col-span-5 xl:col-span-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <SummaryCard
            label="Total Inflow"
            value={formatCurrency(summary?.totalIncome || 0)}
            subtext="Confirmed period income"
            icon={<TrendingUp size={18} strokeWidth={2.2} />}
            tone="slate"
          />
          <SummaryCard
            label="Total Outflow"
            value={formatCurrency(summary?.totalExpense || 0)}
            subtext="Verified period expenses"
            icon={<TrendingDown size={18} strokeWidth={2.2} />}
            tone="red"
          />
          <SummaryCard
            label="Remaining Budget"
            value={formatCurrency(summary?.budgetRemaining || 0)}
            subtext={
              (summary?.budgetRemaining || 0) >= 0
                ? 'Within monthly allocation threshold'
                : 'Exceeds monthly limit'
            }
            icon={<ShieldCheck size={18} strokeWidth={2.2} />}
            tone={(summary?.budgetRemaining || 0) < 0 ? 'red' : 'blue'}
          />
        </div>
      </div>

      {/* 4. Section: Monthly Trend & Category Allocation */}
      <div
        ref={chartsRef}
        className={`grid gap-6 lg:grid-cols-12 transition-all duration-700 ${
          chartsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="lg:col-span-7 xl:col-span-8">
          <MonthlyTrendSection trend={trend} isAnimationActive={chartsVisible} />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <SpendingOverview
            categories={categories}
            totalExpense={summary?.totalExpense || 0}
            isAnimationActive={chartsVisible}
          />
        </div>
      </div>

      {/* 5. Section: Recent Ledger Activity Stream */}
      <div
        ref={lowerRef}
        className={`transition-all duration-700 ${
          lowerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <RecentActivity transactions={recent} />
      </div>
    </div>
  )
}

export default Dashboard