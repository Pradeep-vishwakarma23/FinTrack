import React from 'react'
import { formatCurrency } from '../../utils/format'
import { Icons } from '../common/Icons'

export const CategoryBudgetProgress = ({ categories = [], loading, onExplain }) => {
  if (loading) {
    return (
      <div className="slab-panel p-6 animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-10 bg-slate-100 rounded-2xl"></div>
        <div className="h-10 bg-slate-100 rounded-2xl"></div>
      </div>
    )
  }

  const list = Array.isArray(categories) ? categories : []

  return (
    <div className="slab-panel p-6 sm:p-7 space-y-5">
      <div className="flex items-center justify-between border-b border-emerald-100/70 pb-4">
        <div>
          <p className="editorial-kicker">BUDGET ALLOCATIONS</p>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">Category Spending & Limits</h3>
          <p className="text-xs text-slate-500">Distribution of expenditures against category targets</p>
        </div>
        {onExplain && (
          <button
            type="button"
            onClick={() => onExplain({ contextType: 'category_spend', itemData: { categories: list } })}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/60 px-3 py-1.5 rounded-xl transition shadow-2xs"
            aria-label="Explain category spending"
          >
            <Icons.Sparkles className="w-3.5 h-3.5 text-[#1A956C]" />
            <span>Explain</span>
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs font-medium">
          No category spending recorded for this period.
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((cat, idx) => {
            const hasLimit = cat.budgetLimit !== null && cat.budgetLimit > 0
            const isOver = cat.isOverBudget
            const utilization = cat.budgetUtilization || 0

            return (
              <div key={cat.category || idx} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-sans">{cat.category}</span>
                    <span className="text-[11px] text-slate-400">
                      ({cat.count} txns • {cat.percentage}%)
                    </span>
                    {isOver && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full border border-rose-300">
                        OVER BUDGET
                      </span>
                    )}
                  </div>
                  <div className="text-right font-bold">
                    <span className="text-slate-900">{formatCurrency(cat.amount)}</span>
                    {hasLimit && (
                      <span className="text-slate-400 text-[11px] ml-1 font-normal">
                        / {formatCurrency(cat.budgetLimit)} ({utilization}%)
                      </span>
                    )}
                  </div>
                </div>

                {hasLimit ? (
                  <div className="h-2.5 w-full rounded-full bg-emerald-100/70 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-rose-500' : utilization >= 80 ? 'bg-amber-500' : 'bg-[#35D6A2] shadow-glow-mint'
                      }`}
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    ></div>
                  </div>
                ) : (
                  <div className="h-2 w-full rounded-full bg-emerald-100/60 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400/80 rounded-full"
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CategoryBudgetProgress
