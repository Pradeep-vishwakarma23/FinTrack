import React, { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { formatCurrency } from '../../utils/format'
import {
  TrendingUp,
  ArrowLeftRight,
  ChartSpline,
  CreditCard
} from '../common/Icons'

function MonthlyTrendSection({ trend = [], isAnimationActive = true }) {
  const [activeTab, setActiveTab] = useState('velocity') // 'velocity' (Line) | 'dynamics' (Bar)

  const hasTrend = trend && trend.length > 0

  const chartData = trend.map((t) => ({
    month: t.month,
    Income: t.income || 0,
    Expense: t.expense || 0,
    Savings: t.savings || 0
  }))

  return (
    <section className="slab-panel p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 relative z-10">
        <div>
          <p className="editorial-kicker">HISTORICAL VELOCITY</p>
          <h3 className="text-lg sm:text-xl font-light text-slate-900 tracking-tight mt-0.5">
            {activeTab === 'velocity' ? 'Monthly Spending Velocity' : 'Income vs. Expense Balance'}
          </h3>
          <p className="text-xs text-slate-500">
            {activeTab === 'velocity'
              ? 'Multi-month trend trajectory of verified expenses'
              : 'Comparative cash flow balance over recent monthly periods'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('velocity')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'velocity'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ChartSpline size={13} />
            <span>Velocity</span>
          </button>
          <button
            onClick={() => setActiveTab('dynamics')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'dynamics'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight size={13} />
            <span>Dynamics</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full relative z-10">
        {!hasTrend ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm space-y-2 text-center p-4">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <TrendingUp size={20} />
            </div>
            <p className="text-xs text-slate-500">
              No historical monthly data recorded yet. Record transactions to view trends.
            </p>
          </div>
        ) : activeTab === 'velocity' ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9F7F2" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
                tickFormatter={(val) => `₹${val}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(val, name) => [formatCurrency(val), name]}
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid rgba(53, 214, 162, 0.4)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              <Line
                type="monotone"
                dataKey="Expense"
                name="Expense"
                stroke="#F43F5E"
                strokeWidth={3}
                dot={{ r: 4, fill: '#F43F5E', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 7, fill: '#E11D48' }}
                isAnimationActive={isAnimationActive}
                animationDuration={900}
              />
              <Line
                type="monotone"
                dataKey="Income"
                name="Income"
                stroke="#35D6A2"
                strokeWidth={3}
                dot={{ r: 4, fill: '#35D6A2', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 7, fill: '#1A956C' }}
                isAnimationActive={isAnimationActive}
                animationDuration={900}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9F7F2" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
                tickFormatter={(val) => `₹${val}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(val, name) => [formatCurrency(val), name]}
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid rgba(53, 214, 162, 0.4)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '8px', fontSize: '12px', fontFamily: 'Inter' }}
              />
              <Bar
                dataKey="Income"
                fill="#35D6A2"
                radius={[6, 6, 0, 0]}
                isAnimationActive={isAnimationActive}
              />
              <Bar
                dataKey="Expense"
                fill="#F43F5E"
                radius={[6, 6, 0, 0]}
                isAnimationActive={isAnimationActive}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}

export default MonthlyTrendSection
