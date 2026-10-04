import React from 'react'
import { formatCurrency, formatDate } from '../../utils/format'
import { Icons } from '../common/Icons'

const GoalCard = ({
  goal,
  onEdit,
  onDelete,
  onAskCopilot
}) => {
  const cardRef = React.useRef(null)

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    cardRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
    cardRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
  }
  const {
    _id,
    title,
    targetAmount = 0,
    currentAmount = 0,
    remainingAmount = 0,
    progressPercentage = 0,
    targetDate,
    monthsRemaining = 0,
    requiredMonthlySavings = 0,
    feasibility,
    category = 'General',
    priority = 'medium',
    status = 'in_progress',
    notes,
    isCompleted,
    isOverdue
  } = goal

  // Feasibility styling helpers based on deterministic backend status
  const getFeasibilityConfig = () => {
    const fStatus = feasibility?.status || (isCompleted ? 'ACHIEVED' : '')
    switch (fStatus) {
      case 'ACHIEVED':
        return {
          label: 'Target Achieved',
          badgeClass: 'bg-emerald-100/90 text-emerald-800 border-emerald-300/60',
          indicatorClass: 'bg-[#35D6A2]',
          textClass: 'text-emerald-800'
        }
      case 'HIGHLY_FEASIBLE':
        return {
          label: 'On Track (Feasible)',
          badgeClass: 'bg-emerald-100/90 text-emerald-800 border-emerald-300/60',
          indicatorClass: 'bg-[#35D6A2]',
          textClass: 'text-emerald-800'
        }
      case 'MODERATELY_FEASIBLE':
        return {
          label: 'Challenging (70-99%)',
          badgeClass: 'bg-amber-100/90 text-amber-800 border-amber-300/60',
          indicatorClass: 'bg-amber-500',
          textClass: 'text-amber-800'
        }
      case 'LOW_FEASIBILITY':
        return {
          label: 'Low Feasibility (<70%)',
          badgeClass: 'bg-orange-100/90 text-orange-800 border-orange-300/60',
          indicatorClass: 'bg-orange-500',
          textClass: 'text-orange-800'
        }
      case 'UNFEASIBLE_DEFICIT':
        return {
          label: 'At Risk (Cash Deficit)',
          badgeClass: 'bg-rose-100/90 text-rose-800 border-rose-300/60',
          indicatorClass: 'bg-rose-500',
          textClass: 'text-rose-800'
        }
      default:
        return {
          label: 'Evaluating',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          indicatorClass: 'bg-slate-400',
          textClass: 'text-slate-700'
        }
    }
  }

  // Priority badge helper
  const getPriorityBadge = () => {
    switch (priority) {
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">High</span>
      case 'low':
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">Low</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">Med</span>
    }
  }

  // Status badge helper
  const getStatusBadge = () => {
    if (isCompleted || status === 'completed') {
      return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/50">Completed</span>
    }
    if (status === 'paused') {
      return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300/50">Paused</span>
    }
    if (status === 'cancelled') {
      return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300/50">Cancelled</span>
    }
    return <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-[#35D6A2]/20 text-emerald-800 border border-[#35D6A2]/40">Active</span>
  }

  const feasibilityConfig = getFeasibilityConfig()

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      data-testid={`goal-card-${_id}`}
      className="slab-panel card-spotlight p-6 flex flex-col justify-between space-y-5"
    >
      {/* Top Section: Category, Badges, Title */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              <Icons.Tag className="w-3 h-3 text-emerald-700" />
              <span>{category}</span>
            </span>
            {getPriorityBadge()}
            {getStatusBadge()}
            {isOverdue && (
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                Overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(goal)}
              title="Edit Goal"
              aria-label={`Edit ${title}`}
              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
            >
              <Icons.Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(goal)}
              title="Delete Goal"
              aria-label={`Delete ${title}`}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              <Icons.Trash className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
          {notes && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notes}</p>}
        </div>

        {/* Progress Bar & Amount Row */}
        <div className="space-y-2 pt-1">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-light font-mono text-slate-900">{formatCurrency(currentAmount)}</span>
              <span className="text-xs font-mono text-slate-500 font-medium"> of {formatCurrency(targetAmount)}</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#1A956C]">{progressPercentage}%</span>
          </div>

          <div className="w-full bg-emerald-100/60 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${
                isCompleted
                  ? 'bg-[#35D6A2] shadow-glow-mint'
                  : progressPercentage >= 70
                  ? 'bg-gradient-to-r from-teal-400 to-[#35D6A2] shadow-glow-mint'
                  : progressPercentage >= 30
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-0.5">
            <span>Remaining: <strong className="text-slate-800">{formatCurrency(remainingAmount)}</strong></span>
            <span>Target: <strong className="text-slate-800">{formatDate(targetDate)}</strong></span>
          </div>
        </div>
      </div>

      {/* Middle Section: Deterministic Monthly Savings & Feasibility */}
      <div className="rounded-2xl border border-emerald-100/80 bg-emerald-50/40 p-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Monthly Needed:</span>
          <span className="font-mono font-bold text-slate-900">
            {formatCurrency(requiredMonthlySavings)} / mo
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Timeline:</span>
          <span className="font-mono font-semibold text-slate-700">
            {monthsRemaining} {monthsRemaining === 1 ? 'month' : 'months'}
          </span>
        </div>

        {/* Feasibility Indicator */}
        <div className="pt-2 border-t border-emerald-200/60">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">Feasibility:</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${feasibilityConfig.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${feasibilityConfig.indicatorClass}`} />
              {feasibilityConfig.label}
            </span>
          </div>
          {feasibility?.message && (
            <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">
              {feasibility.message}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Section: Ask Copilot CTA */}
      <div>
        <button
          onClick={() => onAskCopilot && onAskCopilot(goal)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200/80 shadow-xs transition active:scale-95"
        >
          <Icons.Sparkles className="w-3.5 h-3.5 text-[#35D6A2]" />
          <span>Ask Copilot about this goal</span>
        </button>
      </div>
    </div>
  )
}

export default GoalCard
