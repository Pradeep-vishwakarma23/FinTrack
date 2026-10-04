import React from 'react'
import { formatCurrency } from '../../utils/format'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { Icons } from '../common/Icons'

export const TrendOverviewSection = ({
  trends,
  range = '6m',
  onRangeChange,
  loading = false,
  onExplain
}) => {
  const [sectionRef, isVisible] = useScrollReveal({ threshold: 0.1, triggerOnce: true })

  if (loading) {
    return (
      <div className="p-6 sm:p-7 rounded-3xl border border-emerald-100/80 bg-white/80 shadow-card-slab animate-pulse space-y-4" data-testid="trends-loading">
        <div className="h-6 bg-emerald-100/60 rounded-full w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-20 bg-emerald-50/70 rounded-2xl"></div>
          <div className="h-20 bg-emerald-50/70 rounded-2xl"></div>
          <div className="h-20 bg-emerald-50/70 rounded-2xl"></div>
          <div className="h-20 bg-emerald-50/70 rounded-2xl"></div>
        </div>
        <div className="h-48 bg-emerald-50/50 rounded-2xl"></div>
      </div>
    )
  }

  const months = trends?.months || []
  const comparison = trends?.comparison || {}
  const momentum = trends?.momentum || { state: 'INSUFFICIENT_DATA' }
  const categories = trends?.categories || []
  const extremes = trends?.extremes || {}

  const incomeMom = comparison.income || { current: 0, previous: 0, change: 0, percentageChange: 0 }
  const expenseMom = comparison.expenses || { current: 0, previous: 0, change: 0, percentageChange: 0 }
  const savingsMom = comparison.savings || { current: 0, previous: 0, change: 0, percentageChange: 0 }

  const momentumColor =
    momentum.state === 'IMPROVING'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : momentum.state === 'DECLINING'
      ? 'bg-rose-100 text-rose-800 border-rose-300'
      : momentum.state === 'STABLE'
      ? 'bg-teal-100 text-teal-800 border-teal-300'
      : 'bg-emerald-50/80 text-slate-700 border-emerald-200/80'

  // Calculate max scale for visual bars
  const maxVal = Math.max(
    ...months.map((m) => Math.max(m.income, m.expenses, Math.abs(m.netSavings))),
    1000
  )

  return (
    <div
      ref={sectionRef}
      className={`p-6 sm:p-7 rounded-3xl slab-panel space-y-6 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
      data-testid="trend-overview-section"
    >
      {/* 1. Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="editorial-kicker">DIRECTIONAL INTELLIGENCE</p>
          </div>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h3 className="text-lg sm:text-xl font-light text-slate-900 tracking-tight">Multi-Month Financial Trends</h3>
            {onExplain && (
              <button
                onClick={onExplain}
                aria-label="Explain Financial Trends"
                className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/60 transition flex items-center gap-1.5 shadow-2xs"
              >
                <Icons.Sparkles className="w-3.5 h-3.5 text-[#1A956C]" />
                <span>Explain</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparative trajectory, month-over-month growth, and category spending shifts ({trends?.period || 'Historical'})
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-emerald-50/80 p-1 rounded-2xl border border-emerald-200/60 shadow-2xs">
          <button
            type="button"
            onClick={() => onRangeChange && onRangeChange('6m')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              range === '6m'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            data-testid="range-btn-6m"
          >
            6 Months
          </button>
          <button
            type="button"
            onClick={() => onRangeChange && onRangeChange('12m')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              range === '12m'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            data-testid="range-btn-12m"
          >
            12 Months
          </button>
        </div>
      </div>

      {/* 2. Key MoM Metric Cards & Savings Momentum */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Income MoM */}
        <div className="p-4 rounded-2xl border border-emerald-100/80 bg-white/70 space-y-1 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">MoM Income</span>
          <p className="text-lg font-light font-mono text-emerald-800 font-bold">
            {formatCurrency(incomeMom.current)}
          </p>
          <p className="text-[11px] text-slate-600 font-medium">
            <span className={`font-bold ${incomeMom.change >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {incomeMom.change >= 0 ? '+' : ''}{formatCurrency(incomeMom.change)}
            </span>{' '}
            ({incomeMom.percentageChange >= 0 ? '+' : ''}{incomeMom.percentageChange}%)
          </p>
        </div>

        {/* Expenses MoM */}
        <div className="p-4 rounded-2xl border border-emerald-100/80 bg-white/70 space-y-1 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">MoM Expenses</span>
          <p className="text-lg font-light font-mono text-rose-800 font-bold">
            {formatCurrency(expenseMom.current)}
          </p>
          <p className="text-[11px] text-slate-600 font-medium">
            <span className={`font-bold ${expenseMom.change <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {expenseMom.change >= 0 ? '+' : ''}{formatCurrency(expenseMom.change)}
            </span>{' '}
            ({expenseMom.percentageChange >= 0 ? '+' : ''}{expenseMom.percentageChange}%)
          </p>
        </div>

        {/* Savings MoM */}
        <div className="p-4 rounded-2xl border border-emerald-100/80 bg-white/70 space-y-1 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">MoM Net Savings</span>
          <p className="text-lg font-light font-mono text-slate-900 font-bold">
            {formatCurrency(savingsMom.current)}
          </p>
          <p className="text-[11px] text-slate-600 font-medium">
            <span className={`font-bold ${savingsMom.change >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {savingsMom.change >= 0 ? '+' : ''}{formatCurrency(savingsMom.change)}
            </span>{' '}
            vs {comparison.previousMonth || 'prev'}
          </p>
        </div>

        {/* Savings Momentum */}
        <div className="p-4 rounded-2xl border border-emerald-100/80 bg-white/70 flex flex-col justify-between space-y-1 shadow-2xs">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Savings Momentum</span>
          <span
            className={`text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-full border text-center ${momentumColor}`}
            data-testid="savings-momentum-badge"
          >
            {momentum.state || 'STABLE'}
          </span>
          <p className="text-[10px] text-slate-500 text-center truncate font-medium">
            {momentum.state === 'IMPROVING'
              ? 'Savings growth is accelerating'
              : momentum.state === 'DECLINING'
              ? 'Cash flow reserves tightening'
              : momentum.state === 'STABLE'
              ? 'Consistent financial pace'
              : 'Multi-cycle velocity calibrating'}
          </p>
        </div>
      </div>

      {/* Sparse Momentum Placeholder Indicator when INSUFFICIENT_DATA */}
      {(!momentum.state || momentum.state === 'INSUFFICIENT_DATA') && months.length <= 1 && (
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-800 text-sm font-bold shadow-2xs shrink-0">
            <Icons.TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase font-mono">Building Trajectory & Velocity</h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Multi-month momentum indices calibrate automatically across 2+ recorded cycles. Continue logging confirmed transactions to unlock trend projections.
            </p>
          </div>
        </div>
      )}

      {/* 3. Multi-Month Trend Chart Visualization */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span>Monthly Income vs Expense vs Net Savings</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#35D6A2] inline-block"></span> Income</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Expenses</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block"></span> Savings</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/60 border border-emerald-100/80 space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2 items-end min-h-[140px] pt-4">
            {months.map((m) => {
              const incomeHeight = Math.max(4, Math.round((m.income / maxVal) * 100))
              const expenseHeight = Math.max(4, Math.round((m.expenses / maxVal) * 100))
              const savingsHeight = Math.max(2, Math.round((Math.max(0, m.netSavings) / maxVal) * 100))

              return (
                <div key={m.month} className="flex flex-col items-center gap-1.5">
                  <div className="flex items-end gap-1 h-[90px] w-full justify-center">
                    <div
                      className="w-2 bg-[#35D6A2] rounded-t transition-all duration-500 hover:bg-[#1A956C]"
                      style={{ height: `${isVisible ? incomeHeight : 0}%` }}
                      title={`Income: ${formatCurrency(m.income)}`}
                    ></div>
                    <div
                      className="w-2 bg-rose-400 rounded-t transition-all duration-500 hover:bg-rose-500"
                      style={{ height: `${isVisible ? expenseHeight : 0}%` }}
                      title={`Expenses: ${formatCurrency(m.expenses)}`}
                    ></div>
                    <div
                      className="w-2 bg-teal-600 rounded-t transition-all duration-500 hover:bg-teal-700"
                      style={{ height: `${isVisible ? savingsHeight : 0}%` }}
                      title={`Savings: ${formatCurrency(m.netSavings)}`}
                    ></div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 truncate w-full text-center">
                    {m.month.slice(5)}/{m.month.slice(2, 4)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 4. Category Spending Trajectory & Extremes Grid */}
      <div className="grid gap-6 lg:grid-cols-2 pt-2">
        {/* Category Trajectory */}
        <div className="space-y-3">
          <p className="editorial-kicker">CATEGORY SHIFTS</p>
          {categories.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 border border-emerald-100/80 rounded-2xl bg-white/60">
              No category history recorded yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {categories.slice(0, 5).map((c) => {
                const trendTag =
                  c.trend === 'increasing'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : c.trend === 'decreasing'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : c.trend === 'new'
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'

                return (
                  <div
                    key={c.category}
                    className="p-3 rounded-2xl border border-emerald-100/80 bg-white/70 hover:bg-white transition flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{c.category}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Avg: {formatCurrency(c.averageMonthlySpending)}/mo • Total: {formatCurrency(c.totalSpending)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${trendTag}`}>
                        {c.trend}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {c.change >= 0 ? '+' : ''}{formatCurrency(c.change)} MoM
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Historical Extremes */}
        <div className="space-y-3">
          <p className="editorial-kicker">HISTORICAL EXTREMES ({range.toUpperCase()})</p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl border border-emerald-100/80 bg-white/70 space-y-1 shadow-2xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Highest Spending</span>
              <p className="text-sm font-light font-mono font-bold text-rose-800">
                {extremes.highestExpenseMonth ? formatCurrency(extremes.highestExpenseMonth.amount) : '₹0'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {extremes.highestExpenseMonth?.month || 'N/A'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-emerald-100/80 bg-white/70 space-y-1 shadow-2xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Lowest Spending</span>
              <p className="text-sm font-light font-mono font-bold text-emerald-800">
                {extremes.lowestExpenseMonth ? formatCurrency(extremes.lowestExpenseMonth.amount) : '₹0'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {extremes.lowestExpenseMonth?.month || 'N/A'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-emerald-100/80 bg-white/70 space-y-1 shadow-2xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Highest Earnings</span>
              <p className="text-sm font-light font-mono font-bold text-emerald-800">
                {extremes.highestIncomeMonth ? formatCurrency(extremes.highestIncomeMonth.amount) : '₹0'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {extremes.highestIncomeMonth?.month || 'N/A'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-emerald-100/80 bg-white/70 space-y-1 shadow-2xs">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Peak Net Savings</span>
              <p className="text-sm font-light font-mono font-bold text-teal-800">
                {extremes.highestSavingsMonth ? formatCurrency(extremes.highestSavingsMonth.amount) : '₹0'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {extremes.highestSavingsMonth?.month || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrendOverviewSection
