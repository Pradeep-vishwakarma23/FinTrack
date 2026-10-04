import React from 'react'
import { Icons } from '../common/Icons'

const GoalEmptyState = ({ onCreateGoal }) => {
  return (
    <div className="py-14 px-6 rounded-3xl border-2 border-dashed border-emerald-200/80 bg-white/80 backdrop-blur-sm text-center max-w-2xl mx-auto shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center mx-auto text-3xl shadow-sm">
        <Icons.Target className="w-8 h-8 text-emerald-600" />
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-4 tracking-tight">
        Turn your financial progress into a plan.
      </h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
        Set savings targets for vacations, emergency funds, debt payoffs, or investments with automated mathematical feasibility checks.
      </p>

      {/* Feature Value Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-left">
        <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center mb-2">
            <Icons.Target className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <p className="text-xs font-bold text-slate-800">Set a Target</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Define amount and target date</p>
        </div>
        <div className="p-3 rounded-2xl bg-teal-50/50 border border-teal-100">
          <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center mb-2">
            <Icons.ChartSpline className="w-3.5 h-3.5 text-teal-700" />
          </div>
          <p className="text-xs font-bold text-slate-800">Track Progress</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Monitor current savings vs goal</p>
        </div>
        <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100">
          <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center mb-2">
            <Icons.Calendar className="w-3.5 h-3.5 text-indigo-700" />
          </div>
          <p className="text-xs font-bold text-slate-800">Monthly Amount</p>
          <p className="text-[11px] text-slate-500 mt-0.5">See exact monthly need</p>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center mb-2">
            <Icons.Sparkles className="w-3.5 h-3.5 text-[#35D6A2]" />
          </div>
          <p className="text-xs font-bold text-slate-800">Feasibility</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Grounded in cash flow</p>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={onCreateGoal}
          id="create-first-goal-btn"
          className="px-6 py-3 bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 text-xs font-bold rounded-2xl shadow-glow-mint hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
        >
          <Icons.Sparkles className="w-4 h-4 text-slate-950" />
          <span>Create Your First Goal</span>
        </button>
      </div>
    </div>
  )
}

export default GoalEmptyState
