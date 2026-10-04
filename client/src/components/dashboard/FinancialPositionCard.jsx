import React, { useRef } from 'react'
import { formatCurrency } from '../../utils/format'
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from '../common/Icons'

function FinancialPositionCard({
  income = 0,
  expense = 0,
  savings = 0,
  savingsRate = null,
  budgetRemaining = 0
}) {
  const cardRef = useRef(null)

  const isSurplus = savings >= 0
  const isBudgetSafe = budgetRemaining >= 0

  // Calculate expense-to-income percentage safely
  const expensePercentage = income > 0 ? Math.min(Math.round((expense / income) * 100), 100) : expense > 0 ? 100 : 0
  const savingsPercentage = income > 0 ? Math.max(Math.round((savings / income) * 100), 0) : 0

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cardRef.current.style.setProperty('--mouse-x', `${x}px`)
    cardRef.current.style.setProperty('--mouse-y', `${y}px`)
  }

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`slab-panel ${isSurplus ? 'slab-panel-mint' : 'bg-rose-50/40 border-rose-200/80'} p-6 sm:p-8 card-spotlight relative overflow-hidden flex flex-col justify-between`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="editorial-kicker text-[11px] font-bold tracking-wider">
              FINANCIAL POSITION
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                isSurplus
                  ? 'bg-emerald-200/80 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-200/80 text-rose-900 border border-rose-300'
              }`}
            >
              {isSurplus ? (
                <>
                  <ArrowUpRight size={12} className="text-emerald-700" />
                  <span>Surplus Cash Flow</span>
                </>
              ) : (
                <>
                  <ArrowDownRight size={12} className="text-rose-700" />
                  <span>Deficit Warning</span>
                </>
              )}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-light text-slate-900 tracking-tight mt-1">
            {isSurplus ? 'Healthy Financial Balance' : 'Outflow Exceeds Inflow'}
          </h2>
        </div>

        {savingsRate !== null && savingsRate !== undefined && (
          <div className="self-start sm:self-auto px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-emerald-200/80 shadow-xs flex items-center gap-2.5">
            <Coins size={16} className={savingsRate >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Savings Rate
              </p>
              <p
                className={`text-sm font-bold font-mono ${
                  savingsRate >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {savingsRate > 0 ? `+${savingsRate}%` : `${savingsRate}%`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hero Numbers Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-emerald-100/80 relative z-10 mb-6">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
            <TrendingUp size={13} className="text-emerald-600" />
            <span>Total Inflow</span>
          </p>
          <p className="text-2xl sm:text-3xl font-light font-mono text-slate-900 mt-1 tracking-tight">
            {formatCurrency(income)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Confirmed income</p>
        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
            <TrendingDown size={13} className="text-rose-600" />
            <span>Total Outflow</span>
          </p>
          <p className="text-2xl sm:text-3xl font-light font-mono text-rose-900 mt-1 tracking-tight">
            {formatCurrency(expense)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Verified expenses</p>
        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
            <Coins size={13} className={isSurplus ? 'text-emerald-600' : 'text-rose-600'} />
            <span>Net Retained</span>
          </p>
          <p
            className={`text-2xl sm:text-3xl font-light font-mono mt-1 tracking-tight ${
              isSurplus ? 'text-emerald-950 font-normal' : 'text-rose-900'
            }`}
          >
            {formatCurrency(savings)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isSurplus ? 'Retained capital' : 'Period shortfall'}
          </p>
        </div>
      </div>

      {/* Cash Flow Distribution Progress Bar */}
      <div className="space-y-2 relative z-10">
        <div className="flex items-center justify-between text-xs font-mono text-slate-600 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Expense ({expensePercentage}%)</span>
          </span>
          {income > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Retained ({savingsPercentage}%)</span>
            </span>
          )}
        </div>

        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex p-0.5 border border-slate-200/80">
          <div
            className="h-full bg-rose-500 rounded-l-full transition-all duration-700 ease-out"
            style={{ width: `${expensePercentage}%` }}
            title={`Expenses: ${expensePercentage}%`}
          />
          {income > 0 && savings > 0 && (
            <div
              className="h-full bg-emerald-500 rounded-r-full transition-all duration-700 ease-out"
              style={{ width: `${savingsPercentage}%` }}
              title={`Savings: ${savingsPercentage}%`}
            />
          )}
        </div>
      </div>
    </article>
  )
}

export default FinancialPositionCard
