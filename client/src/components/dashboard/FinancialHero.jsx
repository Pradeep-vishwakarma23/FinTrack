import React, { useState } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  ShieldCheck
} from '../common/Icons'

/**
 * Generates an array of past months (e.g. ['2026-10', '2026-09', ...]) up to the current month.
 */
const getRecentMonths = (count = 12) => {
  const months = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    months.push({ key, label })
  }
  return months
}

/**
 * Formats a YYYY-MM string into a human-readable month string (e.g. "October 2026").
 */
const formatMonthLabel = (monthKey) => {
  if (!monthKey || typeof monthKey !== 'string') return ''
  const [yearStr, monthStr] = monthKey.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  if (isNaN(year) || isNaN(month)) return monthKey
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Shifts a YYYY-MM key by delta months.
 */
const shiftMonthKey = (monthKey, delta) => {
  const [yearStr, monthStr] = monthKey.split('-')
  const date = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function FinancialHero({
  selectedMonth,
  onMonthChange,
  onRefresh,
  loading = false
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const recentMonths = getRecentMonths(12)
  const currentMonthKey = recentMonths[0]?.key
  const isCurrentMonth = selectedMonth === currentMonthKey

  const handlePrev = () => {
    const prevKey = shiftMonthKey(selectedMonth, -1)
    onMonthChange(prevKey)
  }

  const handleNext = () => {
    if (isCurrentMonth) return
    const nextKey = shiftMonthKey(selectedMonth, 1)
    onMonthChange(nextKey)
  }

  return (
    <header className="relative w-full mb-8 pt-2 pb-1">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-10">
        {/* Left Editorial Header Column */}
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300/60 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="editorial-kicker text-[11px] font-bold tracking-wider text-emerald-800">
              FINANCIAL OVERVIEW
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-slate-900 tracking-tight leading-[1.05]">
            Your money, <span className="italic font-serif font-normal text-emerald-800">understood.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-xl">
            Real-time cash flow command center, budget velocity, and verified ledger intelligence for{' '}
            <span className="font-semibold text-slate-900">{formatMonthLabel(selectedMonth)}</span>.
          </p>
        </div>

        {/* Right Controls Column: Month Stepper & Quick Selector */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-start lg:self-end">
          {/* Month Stepper Pill */}
          <div className="inline-flex items-center bg-white/90 backdrop-blur-md border border-emerald-200/80 rounded-2xl p-1 shadow-card-slab">
            <button
              onClick={handlePrev}
              title="Previous Month"
              aria-label="Previous Month"
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/80 active:scale-95 transition"
            >
              <ChevronLeft size={16} strokeWidth={2.4} />
            </button>

            {/* Month Select Button / Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold font-mono text-slate-800 hover:text-emerald-800 flex items-center gap-2 rounded-xl transition"
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
              >
                <Calendar size={14} className="text-emerald-600" />
                <span>{formatMonthLabel(selectedMonth)}</span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full mt-2 w-56 max-h-64 overflow-y-auto bg-white/95 backdrop-blur-xl border border-emerald-200 rounded-2xl shadow-xl z-50 p-1.5 animate-fade-slide-up"
                    role="listbox"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100">
                      Select Period
                    </div>
                    {recentMonths.map((m) => {
                      const isSelected = m.key === selectedMonth
                      return (
                        <button
                          key={m.key}
                          onClick={() => {
                            onMonthChange(m.key)
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-medium rounded-xl flex items-center justify-between transition ${
                            isSelected
                              ? 'bg-emerald-100/90 text-emerald-900 font-bold'
                              : 'text-slate-700 hover:bg-emerald-50/70 hover:text-slate-900'
                          }`}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span>{m.label}</span>
                          {isSelected && <span className="text-emerald-700 text-xs">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={isCurrentMonth}
              title={isCurrentMonth ? 'Cannot navigate beyond current month' : 'Next Month'}
              aria-label="Next Month"
              className={`p-1.5 sm:p-2 rounded-xl transition ${
                isCurrentMonth
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/80 active:scale-95'
              }`}
            >
              <ChevronRight size={16} strokeWidth={2.4} />
            </button>
          </div>

          {/* Refresh Action Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Financial Ledger"
            aria-label="Refresh Financial Ledger"
            className="px-3.5 sm:px-4 py-2 bg-white/90 hover:bg-white active:bg-slate-50 border border-emerald-200/80 text-slate-800 text-xs font-semibold rounded-2xl shadow-card-slab transition flex items-center gap-2 active:scale-95"
          >
            <RefreshCw
              size={14}
              className={`text-emerald-700 transition-transform ${loading ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default FinancialHero
