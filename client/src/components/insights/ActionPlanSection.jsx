import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchActionPlans,
  generateActionPlans,
  completeActionPlan,
  dismissActionPlan,
  setFilterPriority,
  setFilterStatus,
  clearActionPlanError,
  clearGenerateSummary
} from '../../redux/slices/actionPlanSlice'
import { formatCurrency, formatDate } from '../../utils/format'
import { Icons } from '../common/Icons'

/**
 * Priority badge helper
 */
const PriorityBadge = ({ priority }) => {
  const p = (priority || 'MEDIUM').toUpperCase()
  switch (p) {
    case 'HIGH':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
          HIGH PRIORITY
        </span>
      )
    case 'MEDIUM':
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
          MEDIUM PRIORITY
        </span>
      )
    case 'LOW':
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
          LOW PRIORITY
        </span>
      )
  }
}

/**
 * Action type label & icon helper
 */
const getActionTypeMeta = (actionType) => {
  switch (actionType) {
    case 'REDUCE_CATEGORY':
      return { label: 'Category Reduction', IconComponent: Icons.Sliders, color: 'text-amber-800 bg-amber-50 border-amber-200' }
    case 'REDUCE_RECURRING':
      return { label: 'Recurring Review', IconComponent: Icons.Refresh, color: 'text-indigo-800 bg-indigo-50 border-indigo-200' }
    case 'INCREASE_SAVINGS':
      return { label: 'Savings Expansion', IconComponent: Icons.TrendingUp, color: 'text-emerald-800 bg-emerald-50 border-emerald-200' }
    case 'MAINTAIN_SAVINGS':
      return { label: 'Maintain Target', IconComponent: Icons.Target, color: 'text-teal-800 bg-teal-50 border-teal-200' }
    case 'GOAL_CONTRIBUTION':
      return { label: 'Goal Contribution', IconComponent: Icons.Sparkles, color: 'text-purple-800 bg-purple-50 border-purple-200' }
    case 'REVIEW_ANOMALY':
      return { label: 'Spending Anomaly', IconComponent: Icons.AlertTriangle, color: 'text-rose-800 bg-rose-50 border-rose-200' }
    default:
      return { label: 'Financial Action', IconComponent: Icons.Sparkles, color: 'text-slate-700 bg-slate-50 border-slate-200' }
  }
}

/**
 * Individual Action Plan Card
 */
export const ActionPlanCard = ({
  plan,
  onComplete,
  onDismiss,
  onExplain,
  isProcessing
}) => {
  const typeMeta = getActionTypeMeta(plan.actionType)
  const TypeIcon = typeMeta.IconComponent
  const isCompleted = plan.status === 'COMPLETED'
  const isDismissed = plan.status === 'DISMISSED'
  const isActive = plan.status === 'ACTIVE'

  return (
    <div
      className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xs ${
        isCompleted
          ? 'bg-emerald-50/40 border-emerald-200 opacity-90'
          : isDismissed
          ? 'bg-slate-50/60 border-slate-200 opacity-60'
          : 'bg-white/80 border-emerald-100/90 hover:shadow-md hover:border-[#35D6A2]'
      }`}
      data-testid={`action-plan-card-${plan._id}`}
    >
      {/* Header: Type, Priority, Status */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-xl border flex items-center gap-1.5 ${typeMeta.color}`}>
              <TypeIcon className="w-3 h-3 flex-shrink-0" />
              <span>{typeMeta.label}</span>
            </span>
            {plan.category && plan.category !== 'General' && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                {plan.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={plan.priority} />
            {isCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Icons.Check className="w-3 h-3" />
                <span>Completed</span>
              </span>
            )}
            {isDismissed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-700 border border-slate-300">
                <Icons.X className="w-3 h-3" />
                <span>Dismissed</span>
              </span>
            )}
          </div>
        </div>

        {/* Title and Description */}
        <div>
          <h4 className={`text-base font-bold text-slate-900 ${isCompleted ? 'line-through text-slate-600' : ''}`}>
            {plan.title}
          </h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {plan.description}
          </p>
        </div>
      </div>

      {/* Measurable Targets & Impact Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-emerald-50/40 border border-emerald-100/70 text-xs font-mono">
        {plan.targetAmount > 0 && (
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Amount</span>
            <span className="text-sm font-bold text-slate-800">
              {formatCurrency(plan.targetAmount)}
            </span>
          </div>
        )}
        <div>
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Monthly Impact</span>
          <span className="text-sm font-bold text-emerald-800">
            +{formatCurrency(plan.monthlyImpact)}/mo
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-indigo-700 block">6-Month Impact</span>
          <span className="text-sm font-bold text-indigo-800">
            +{formatCurrency(plan.potentialSixMonthImpact || plan.monthlyImpact * 6)}
          </span>
        </div>
      </div>

      {/* Rationale Callout */}
      {plan.rationale && (
        <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-[11px] text-emerald-950 flex items-start gap-2">
          <Icons.Sparkles className="w-3.5 h-3.5 text-[#1A956C] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-900">Verified Rationale: </span>
            <span>{plan.rationale}</span>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onExplain && (
            <button
              onClick={() => onExplain(plan)}
              className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5"
              aria-label="Explain action plan with Copilot"
            >
              <Icons.Sparkles className="w-3 h-3 text-[#1A956C]" />
              <span>Explain</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {isActive && (
            <>
              <button
                onClick={() => onDismiss(plan._id)}
                disabled={isProcessing}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition disabled:opacity-50"
                data-testid={`dismiss-plan-btn-${plan._id}`}
              >
                Dismiss
              </button>
              <button
                onClick={() => onComplete(plan._id)}
                disabled={isProcessing}
                className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 shadow-glow-mint transition disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
                data-testid={`complete-plan-btn-${plan._id}`}
              >
                <Icons.Check className="w-3 h-3 text-slate-950" />
                <span>Complete</span>
              </button>
            </>
          )}
          {!isActive && (
            <span className="text-[11px] font-mono text-slate-400 font-medium">
              {isCompleted && plan.completedAt ? `Completed on ${formatDate(plan.completedAt)}` : ''}
              {isDismissed && plan.dismissedAt ? `Dismissed on ${formatDate(plan.dismissedAt)}` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Summary Stats Banner
 */
export const ActionPlanSummary = ({ plans = [] }) => {
  const activePlans = plans.filter((p) => p.status === 'ACTIVE')
  const totalMonthlyImpact = activePlans.reduce((sum, p) => sum + (p.monthlyImpact || 0), 0)
  const totalSixMonthImpact = activePlans.reduce(
    (sum, p) => sum + (p.potentialSixMonthImpact || (p.monthlyImpact || 0) * 6),
    0
  )
  const highPriorityCount = activePlans.filter((p) => p.priority === 'HIGH').length

  return (
    <div className="p-6 rounded-3xl bg-slate-950 text-white shadow-xl space-y-4 border border-emerald-950">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#35D6A2]">PLANNING INTELLIGENCE SUMMARY</span>
          <h3 className="text-lg font-light text-white tracking-tight mt-0.5">Actionable Financial Growth Potential</h3>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-[#35D6A2] border border-emerald-500/30">
            {activePlans.length} Active Plan{activePlans.length === 1 ? '' : 's'}
          </span>
          {highPriorityCount > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {highPriorityCount} Urgent
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1 font-mono">
        <div>
          <p className="text-[11px] uppercase font-semibold text-slate-400 font-sans">Potential Monthly Impact</p>
          <p className="text-2xl font-light font-mono text-[#35D6A2] mt-0.5 font-bold">
            +{formatCurrency(totalMonthlyImpact)}
            <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>
          </p>
          <p className="text-[10px] text-slate-400 font-sans">Combined monthly savings</p>
        </div>
        <div>
          <p className="text-[11px] uppercase font-semibold text-slate-400 font-sans">Potential 6-Month Impact</p>
          <p className="text-2xl font-light font-mono text-teal-300 mt-0.5 font-bold">
            +{formatCurrency(totalSixMonthImpact)}
          </p>
          <p className="text-[10px] text-slate-400 font-sans">If maintained for 6 months</p>
        </div>
        <div>
          <p className="text-[11px] uppercase font-semibold text-slate-400 font-sans">Completed Actions</p>
          <p className="text-2xl font-light font-mono text-white mt-0.5 font-bold">
            {plans.filter((p) => p.status === 'COMPLETED').length}
          </p>
          <p className="text-[10px] text-slate-400 font-sans">Goals and plans fulfilled</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Empty State Component
 */
export const ActionPlanEmptyState = ({ onGenerate, isGenerating }) => {
  return (
    <div
      className="p-10 rounded-3xl border-2 border-dashed border-emerald-200/80 bg-white/60 text-center space-y-4"
      data-testid="action-plan-empty-state"
    >
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
        <Icons.Target className="w-8 h-8 text-emerald-600" />
      </div>
      <div className="max-w-md mx-auto space-y-1">
        <h4 className="text-base font-bold text-slate-900">No Active Action Plans</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          FinTrack can analyze your confirmed income, recurring commitments, spending anomalies, and goals to generate deterministic, realistic financial steps.
        </p>
      </div>
      <div>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="px-5 py-2.5 bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 text-xs font-bold rounded-2xl shadow-glow-mint transition flex items-center gap-2 mx-auto disabled:opacity-50 active:scale-95"
          data-testid="generate-action-plans-empty-btn"
        >
          <Icons.Sparkles className="w-4 h-4 text-slate-950" />
          <span>{isGenerating ? 'Analyzing Intelligence...' : 'Generate Action Plans'}</span>
        </button>
      </div>
    </div>
  )
}

/**
 * Main ActionPlanSection Component
 */
export const ActionPlanSection = ({ onExplainAction }) => {
  const dispatch = useDispatch()
  const {
    plans,
    loading,
    error,
    generating,
    generateSummary,
    actionLoadingId,
    actionError,
    filterPriority,
    filterStatus
  } = useSelector((state) => state.actionPlans)

  useEffect(() => {
    dispatch(fetchActionPlans())
  }, [dispatch])

  const handleGenerate = () => {
    dispatch(generateActionPlans())
  }

  const handleComplete = (id) => {
    dispatch(completeActionPlan(id))
  }

  const handleDismiss = (id) => {
    dispatch(dismissActionPlan(id))
  }

  // Filter plans based on UI controls
  const filteredPlans = plans.filter((plan) => {
    const matchesStatus =
      filterStatus === 'ALL'
        ? true
        : (plan.status || 'ACTIVE') === filterStatus
    const matchesPriority =
      filterPriority === 'ALL'
        ? true
        : (plan.priority || 'MEDIUM') === filterPriority
    return matchesStatus && matchesPriority
  })

  return (
    <section className="slab-panel p-6 sm:p-7 space-y-6" data-testid="action-plan-section">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="editorial-kicker">STEP-BY-STEP MOVES</p>
          </div>
          <h3 className="text-lg font-light text-slate-900 tracking-tight mt-0.5">Financial Action Plans</h3>
          <p className="text-xs text-slate-500">
            Deterministic, measurable steps derived directly from your verified financial data.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-5 py-2.5 bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 text-xs font-bold rounded-2xl shadow-glow-mint transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
            data-testid="generate-action-plans-btn"
          >
            <Icons.Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>{generating ? 'Analyzing & Generating...' : 'Generate Action Plans'}</span>
          </button>
        </div>
      </div>

      {/* Action Errors / Generation Summaries */}
      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => dispatch(clearActionPlanError())} className="font-bold hover:text-rose-900">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      )}

      {generateSummary && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Check className="w-4 h-4 text-emerald-700" />
            <span>
              {generateSummary.generatedCount > 0
                ? `Generated ${generateSummary.generatedCount} new action plan(s).`
                : 'All current financial intelligence is already covered by your active action plans.'}
              {generateSummary.skippedCount > 0 && ` (${generateSummary.skippedCount} duplicates skipped)`}
            </span>
          </div>
          <button onClick={() => dispatch(clearGenerateSummary())} className="font-bold hover:text-emerald-900">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Matrix if plans exist */}
      {plans.length > 0 && <ActionPlanSummary plans={plans} />}

      {/* Filter Tabs */}
      {plans.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-emerald-50/80 p-1 rounded-2xl text-xs font-semibold text-slate-600 border border-emerald-200/60">
            {['ACTIVE', 'COMPLETED', 'DISMISSED', 'ALL'].map((status) => (
              <button
                key={status}
                onClick={() => dispatch(setFilterStatus(status))}
                className={`px-3 py-1 rounded-xl transition ${
                  filterStatus === status
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1 text-xs font-mono">
            <span className="text-slate-400 font-semibold mr-1">Priority:</span>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => (
              <button
                key={priority}
                onClick={() => dispatch(setFilterPriority(priority))}
                className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold transition ${
                  filterPriority === priority
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      {loading && plans.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-3 border-[#35D6A2] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">Loading financial action plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <ActionPlanEmptyState onGenerate={handleGenerate} isGenerating={generating} />
      ) : filteredPlans.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-xs space-y-1">
          <Icons.Search className="w-6 h-6 text-slate-400 mx-auto mb-1" />
          <p className="font-semibold text-slate-600">No action plans match the selected filters.</p>
          <p>Try switching to &apos;Active&apos; or &apos;All&apos;.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => (
            <ActionPlanCard
              key={plan._id}
              plan={plan}
              onComplete={handleComplete}
              onDismiss={handleDismiss}
              onExplain={onExplainAction}
              isProcessing={actionLoadingId === plan._id}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default ActionPlanSection
