import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  closeExplainModal,
  openCopilotDrawer,
  sendCopilotMessage
} from '../../redux/slices/copilotSlice'
import { Icons } from '../common/Icons'

export const ExplainThisModal = () => {
  const dispatch = useDispatch()
  const {
    isExplainModalOpen,
    explanation,
    explanationLoading,
    explanationError,
    explanationContextType,
    provider,
    month
  } = useSelector((state) => state.copilot)

  const { period } = useSelector((state) => state.insights)
  const activeMonth = month || period

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isExplainModalOpen) {
        dispatch(closeExplainModal())
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch, isExplainModalOpen])

  if (!isExplainModalOpen) return null

  const handleAskCopilotMore = () => {
    dispatch(closeExplainModal())
    dispatch(openCopilotDrawer())
    const prompt = `Can you explain more about my ${explanationContextType || 'financial metrics'} for ${activeMonth}?`
    dispatch(sendCopilotMessage({ message: prompt, month: activeMonth }))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Financial Metric Explanation"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden flex flex-col max-h-[90vh] animate-fade-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950 text-white flex items-center justify-between gap-3 border-b border-emerald-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#35D6A2]/20 border border-[#35D6A2]/40 flex items-center justify-center text-base">
              <Icons.Sparkles className="w-4 h-4 text-[#35D6A2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Explain This Metric</h3>
                <span
                  className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                    provider === 'gemini'
                      ? 'bg-emerald-500/20 text-[#35D6A2] border-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}
                >
                  {provider === 'gemini' ? 'Grounded Engine' : 'Financial Intelligence'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Grounded in verified {activeMonth} Banking Intelligence</p>
            </div>
          </div>

          <button
            onClick={() => dispatch(closeExplainModal())}
            aria-label="Close Explanation Modal"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {explanationLoading && (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#35D6A2] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-500 font-medium">Analyzing verified drivers and cash flow...</p>
            </div>
          )}

          {explanationError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <Icons.AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{explanationError}</span>
            </div>
          )}

          {!explanationLoading && !explanationError && explanation && (
            <>
              {/* Title & Core Explanation */}
              <div className="space-y-2">
                <h4 className="text-base font-bold text-slate-900 tracking-tight">{explanation.title}</h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/70">
                  {explanation.explanation}
                </p>
              </div>

              {/* Key Drivers */}
              {Array.isArray(explanation.keyDrivers) && explanation.keyDrivers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Key Financial Drivers</p>
                  <div className="space-y-1.5">
                    {explanation.keyDrivers.map((driver, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white border border-emerald-100 text-xs text-slate-800 font-medium flex items-center gap-2.5 shadow-2xs"
                      >
                        <Icons.ChartSpline className="w-3.5 h-3.5 text-[#1A956C] flex-shrink-0" />
                        <span>{driver}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Action */}
              {explanation.recommendedAction && (
                <div className="p-4 rounded-2xl bg-[#35D6A2]/15 border border-[#35D6A2]/40 text-emerald-950 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    <Icons.Target className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Recommended Action</span>
                  </div>
                  <p className="text-xs leading-relaxed font-medium text-emerald-900">{explanation.recommendedAction}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={() => dispatch(closeExplainModal())}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            Close
          </button>
          <button
            onClick={handleAskCopilotMore}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 rounded-xl shadow-glow-mint transition flex items-center gap-1.5 active:scale-95"
          >
            <Icons.MessageSquare className="w-3.5 h-3.5 text-slate-950" />
            <span>Ask Copilot More</span>
            <Icons.ArrowRight className="w-3.5 h-3.5 text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExplainThisModal
