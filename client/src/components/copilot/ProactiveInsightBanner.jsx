import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProactiveInsights, openCopilotDrawer, sendCopilotMessage } from '../../redux/slices/copilotSlice'
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  ArrowRight,
  ShieldCheck
} from '../common/Icons'

export const ProactiveInsightBanner = ({ month }) => {
  const dispatch = useDispatch()
  const { proactiveInsights, insightsLoading, insightsError } = useSelector((state) => state.copilot)
  const { period } = useSelector((state) => state.insights)
  const activeMonth = month || period

  useEffect(() => {
    if (activeMonth) {
      dispatch(fetchProactiveInsights(activeMonth))
    }
  }, [dispatch, activeMonth])

  if (insightsLoading && (!proactiveInsights || proactiveInsights.length === 0)) {
    return null
  }

  if (insightsError || !proactiveInsights || proactiveInsights.length === 0) {
    return null
  }

  const handleActionClick = (insight) => {
    dispatch(openCopilotDrawer())
    const prompt =
      insight.type === 'danger'
        ? `What is causing my deficit this month and how can I fix it?`
        : insight.id === 'insight_category_concentration'
        ? `How can I balance my spending across categories?`
        : `Explain my latest financial alert: ${insight.title}`

    dispatch(sendCopilotMessage({ message: prompt, month: activeMonth }))
  }

  const getTypeStyles = (type) => {
    switch (type) {
      case 'danger':
        return {
          panel: 'bg-gradient-to-r from-rose-50/95 to-white/90 border-rose-200/90 text-rose-950',
          kicker: 'text-rose-700 font-bold',
          badge: 'bg-rose-500/15 text-rose-700 border-rose-400/40',
          icon: <AlertTriangle size={20} className="text-rose-600" />,
          actionBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
        }
      case 'warning':
        return {
          panel: 'bg-gradient-to-r from-amber-50/95 to-white/90 border-amber-200/90 text-amber-950',
          kicker: 'text-amber-800 font-bold',
          badge: 'bg-amber-500/15 text-amber-800 border-amber-400/40',
          icon: <AlertTriangle size={20} className="text-amber-600" />,
          actionBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
        }
      case 'success':
        return {
          panel: 'bg-gradient-to-r from-emerald-50/95 to-white/90 border-emerald-200/90 text-emerald-950',
          kicker: 'text-emerald-800 font-bold',
          badge: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/40',
          icon: <CheckCircle2 size={20} className="text-emerald-600" />,
          actionBtn: 'bg-[#1A956C] hover:bg-emerald-700 text-white shadow-emerald-600/20'
        }
      default:
        return {
          panel: 'bg-gradient-to-r from-teal-50/95 to-white/90 border-teal-200/90 text-slate-900',
          kicker: 'text-teal-800 font-bold',
          badge: 'bg-teal-500/15 text-teal-800 border-teal-400/40',
          icon: <Sparkles size={20} className="text-teal-600" />,
          actionBtn: 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/20'
        }
    }
  }

  return (
    <div className="space-y-4" role="region" aria-label="Proactive Financial Insights">
      {proactiveInsights.map((insight) => {
        const styles = getTypeStyles(insight.type)
        return (
          <div
            key={insight.id}
            className={`p-6 rounded-3xl border shadow-card-slab transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 group ${styles.panel}`}
          >
            {/* Ambient Corner Accent */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-400/10 pointer-events-none blur-xl group-hover:scale-125 transition-transform" />

            <div className="flex items-start gap-4 relative z-10 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-white/80 border border-emerald-100 shadow-2xs flex items-center justify-center shrink-0">
                {styles.icon}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${styles.badge}`}>
                    {insight.type}
                  </span>
                  <p className="text-[11px] font-mono tracking-widest uppercase text-slate-500">INTELLIGENCE CALLOUT</p>
                </div>
                <h3 className="text-base sm:text-lg font-light tracking-tight text-slate-900 uppercase">
                  {insight.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal max-w-2xl">
                  {insight.message}
                </p>
              </div>
            </div>

            {insight.actionLabel && (
              <button
                onClick={() => handleActionClick(insight)}
                className={`self-start md:self-auto px-5 py-2.5 text-xs font-bold rounded-2xl shadow-sm transition-all whitespace-nowrap active:scale-95 shrink-0 flex items-center gap-1.5 relative z-10 ${styles.actionBtn}`}
              >
                <span>{insight.actionLabel}</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ProactiveInsightBanner
