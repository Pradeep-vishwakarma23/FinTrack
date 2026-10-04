import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { formatCurrency } from '../../utils/format'
import {
  PieChartIcon,
  Tag,
  ArrowUpRight,
  TrendingDown
} from '../common/Icons'

const PALETTE = [
  '#35D6A2', // Emerald Mint
  '#22B886', // Deep Mint
  '#6366F1', // Indigo
  '#38BDF8', // Cyan
  '#F59E0B', // Amber
  '#F43F5E', // Rose
  '#A855F7', // Purple
  '#14B8A6'  // Teal
]

function SpendingOverview({ categories = [], totalExpense = 0, isAnimationActive = true }) {
  const hasData = categories && categories.length > 0

  return (
    <section className="slab-panel p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
      {/* Header */}
      <div className="mb-5 relative z-10">
        <div className="flex items-center justify-between">
          <p className="editorial-kicker">ALLOCATION</p>
          <span className="text-[11px] font-mono text-slate-400 font-semibold">
            {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
          </span>
        </div>
        <h3 className="text-lg sm:text-xl font-light text-slate-900 tracking-tight mt-0.5">
          Category Distribution
        </h3>
        <p className="text-xs text-slate-500">Breakdown of confirmed expense categories</p>
      </div>

      {/* Visualization Canvas */}
      <div className="h-56 sm:h-64 w-full relative z-10 flex items-center justify-center">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm space-y-2 text-center p-4">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <PieChartIcon size={20} />
            </div>
            <p className="text-xs text-slate-500">No expense category records for this period.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                isAnimationActive={isAnimationActive}
                animationDuration={900}
              >
                {categories.map((entry, index) => (
                  <Cell
                    key={`cat-${index}`}
                    fill={PALETTE[index % PALETTE.length]}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(val, name, entry) => [
                  `${formatCurrency(val)} (${entry.payload.percentage}%)`,
                  name
                ]}
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid rgba(53, 214, 162, 0.4)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Legend Badges */}
      {hasData && (
        <div className="space-y-2 pt-3 border-t border-emerald-100/60 relative z-10">
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {categories.map((c, i) => (
              <div
                key={c.category}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-white/80 border border-emerald-100/80 shadow-2xs hover:bg-white transition"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                />
                <span className="text-slate-800 font-medium truncate max-w-[110px]">
                  {c.category}
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  {c.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default SpendingOverview
