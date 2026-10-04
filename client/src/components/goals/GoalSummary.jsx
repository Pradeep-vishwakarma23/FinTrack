import React from 'react'
import { formatCurrency } from '../../utils/format'
import { Icons } from '../common/Icons'

const GoalSummary = ({ goals = [] }) => {
  const activeGoals = goals.filter(
    (g) => g.status === 'in_progress' || g.status === 'paused'
  )
  const completedGoals = goals.filter(
    (g) => g.status === 'completed' || g.isCompleted
  )

  const totalTarget = activeGoals.reduce((sum, g) => sum + (Number(g.targetAmount) || 0), 0)
  const totalSaved = activeGoals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0)
  const totalRemaining = Math.max(0, totalTarget - totalSaved)
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Active Goals Card */}
      <div onMouseMove={handleMouseMove} className="slab-panel card-spotlight p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Active Goals</span>
          <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center text-sm font-bold shadow-xs">
            <Icons.Target className="w-4 h-4 text-emerald-700" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-light font-mono text-slate-900">{activeGoals.length}</span>
          <span className="text-xs text-slate-500 font-medium">In Progress</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {completedGoals.length} completed all-time
        </p>
      </div>

      {/* 2. Total Target Value */}
      <div onMouseMove={handleMouseMove} className="slab-panel card-spotlight p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Total Target</span>
          <span className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center text-sm font-bold shadow-xs">
            <Icons.Coins className="w-4 h-4 text-teal-700" />
          </span>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-light font-mono text-slate-900">{formatCurrency(totalTarget)}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Target across active goals
        </p>
      </div>

      {/* 3. Total Saved Value */}
      <div onMouseMove={handleMouseMove} className="slab-panel-mint card-spotlight p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-800">Total Saved</span>
          <span className="w-9 h-9 rounded-2xl bg-[#35D6A2] text-slate-950 flex items-center justify-center text-sm font-bold shadow-glow-mint">
            <Icons.Sparkles className="w-4 h-4 text-slate-950" />
          </span>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-light font-mono text-emerald-950 font-black">{formatCurrency(totalSaved)}</span>
        </div>
        <p className="text-xs text-emerald-800/80 mt-1 font-medium">
          {formatCurrency(totalRemaining)} remaining to save
        </p>
      </div>

      {/* 4. Overall Progress */}
      <div onMouseMove={handleMouseMove} className="slab-panel card-spotlight p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">Overall Progress</span>
          <span className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center text-sm font-bold shadow-xs">
            <Icons.TrendingUp className="w-4 h-4 text-indigo-700" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-light font-mono text-slate-900">{overallProgress}%</span>
          <span className="text-xs text-slate-500 font-medium">Achieved</span>
        </div>
        <div className="mt-3 w-full bg-emerald-100/70 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-[#35D6A2] h-2.5 rounded-full transition-all duration-700 shadow-glow-mint"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default GoalSummary
