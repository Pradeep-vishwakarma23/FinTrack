import React from 'react'
import { formatCurrency } from '../../utils/format'
import { Icons } from '../common/Icons'

export const BudgetRiskCard = ({ forecast, loading, onExplain }) => {
  if (loading) {
    return (
      <div className="slab-panel p-6 animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-8 bg-slate-200 rounded w-1/2"></div>
      </div>
    )
  }

  const riskLevel = forecast?.riskLevel || 'SAFE'
  const monthlyBudget = forecast?.monthlyBudget || 0
  const budgetVelocity = forecast?.budgetVelocity
  const currentExpense = forecast?.currentMonthExpense || 0
  const riskDetails = forecast?.riskDetails || {}

  const getRiskTheme = () => {
    switch (riskLevel) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-800',
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
          IconComponent: Icons.AlertTriangle,
          label: 'CRITICAL OVERRUN RISK'
        }
      case 'ELEVATED':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
          IconComponent: Icons.AlertTriangle,
          label: 'ELEVATED BUDGET PACE'
        }
      default:
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          IconComponent: Icons.ShieldCheck,
          label: 'SAFE & DISCIPLINED'
        }
    }
  }

  const theme = getRiskTheme()
  const IconComp = theme.IconComponent

  return (
    <div className="slab-panel p-6 sm:p-7 flex flex-col justify-between space-y-5">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <p className="editorial-kicker">ALLOCATION BURN</p>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">Budget Velocity & Risk</h3>
            </div>
            {onExplain && (
              <button
                onClick={onExplain}
                aria-label="Explain Budget Velocity"
                className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition flex items-center gap-1.5 self-start mt-1"
              >
                <Icons.Sparkles className="w-3 h-3 text-indigo-600" />
                <span>Explain</span>
              </button>
            )}
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1 rounded-full border ${theme.badgeBg}`}>
            <IconComp className="w-3.5 h-3.5" />
            <span>{riskLevel}</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Evaluation of spending velocity against monthly targets</p>
      </div>

      <div className={`p-5 rounded-2xl border ${theme.bg} ${theme.border} ${theme.text} space-y-2.5`}>
        <div className="flex items-center justify-between font-semibold text-xs">
          <span>Target Monthly Budget:</span>
          <span className="font-mono font-bold text-sm">
            {monthlyBudget > 0 ? formatCurrency(monthlyBudget) : 'No Budget Set'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span>Current Spend:</span>
          <span className="font-mono font-medium">
            {formatCurrency(currentExpense)} ({riskDetails.currentUtilization || 0}%)
          </span>
        </div>
        {budgetVelocity !== null && budgetVelocity !== undefined && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-200/60 font-mono">
            <span>Burn Velocity:</span>
            <span className="font-bold">{budgetVelocity}x</span>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        {riskDetails.message || 'Spending pace is being tracked against your financial targets.'}
      </p>
    </div>
  )
}

export default BudgetRiskCard
