import React from 'react'
import { formatCurrency } from '../../utils/format'
import { Icons } from '../common/Icons'

export const ForecastCard = ({ forecast, loading, onExplain }) => {
  if (loading) {
    return (
      <div className="slab-panel p-6 animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-8 bg-slate-200 rounded w-1/2"></div>
        <div className="h-3 bg-slate-200 rounded w-full"></div>
      </div>
    )
  }

  const projectedExpense = forecast?.projectedExpense || 0
  const dailyBurnRate = forecast?.dailyBurnRate || 0
  const daysElapsed = forecast?.daysElapsed || 1
  const totalDays = forecast?.totalDaysInMonth || 30
  const confidence = forecast?.confidence || 0
  const method = forecast?.forecastMethod || 'Linear run-rate projection'

  return (
    <div className="slab-panel p-6 sm:p-7 flex flex-col justify-between space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <p className="editorial-kicker">PROJECTION</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">Expense Forecast</h3>
            </div>
            {onExplain && (
              <button
                onClick={onExplain}
                aria-label="Explain Expense Forecast"
                className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition flex items-center gap-1.5 self-start mt-1"
              >
                <Icons.Sparkles className="w-3 h-3 text-indigo-600" />
                <span>Explain</span>
              </button>
            )}
          </div>
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Day {daysElapsed} of {totalDays}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Projected month-end expenditure based on daily run rate</p>
      </div>

      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-xl border border-emerald-900/40">
        <p className="text-xs font-mono uppercase tracking-wider font-bold text-[#35D6A2]">Projected Total Expense</p>
        <p className="text-3xl font-light font-mono mt-2 font-black text-white">{formatCurrency(projectedExpense)}</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 text-xs font-mono text-slate-300">
          <span>Daily Burn Rate:</span>
          <span className="font-bold text-emerald-300">{formatCurrency(dailyBurnRate)} / day</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-mono font-semibold text-slate-700">
          <span>Forecast Confidence</span>
          <span className="text-emerald-700 font-bold">{confidence}%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-emerald-100/70 overflow-hidden">
          <div
            className="h-full bg-[#35D6A2] rounded-full transition-all duration-500 shadow-glow-mint"
            style={{ width: `${Math.min(confidence, 100)}%` }}
          ></div>
        </div>
      </div>

      <p className="text-[11px] font-mono text-slate-400 border-t border-slate-100 pt-3">
        Method: {method}
      </p>
    </div>
  )
}

export default ForecastCard
