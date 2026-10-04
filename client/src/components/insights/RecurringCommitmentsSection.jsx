import React from 'react'
import { formatCurrency, formatDate } from '../../utils/format'
import { Icons } from '../common/Icons'

export const RecurringCommitmentsSection = ({ subscriptions = [], summary = null, loading = false, onExplain }) => {
  if (loading) {
    return (
      <div className="slab-panel p-6 animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-16 bg-slate-100 rounded-2xl"></div>
        <div className="h-16 bg-slate-100 rounded-2xl"></div>
      </div>
    )
  }

  const list = Array.isArray(subscriptions) ? subscriptions : []
  const totalCost = summary?.estimatedMonthlyRecurringCost ?? list.reduce((sum, s) => {
    switch (s.cadence) {
      case 'weekly': return sum + (s.latestAmount * 4.33)
      case 'biweekly': return sum + (s.latestAmount * 2.17)
      case 'quarterly': return sum + (s.latestAmount / 3)
      case 'monthly':
      default: return sum + s.latestAmount
    }
  }, 0)

  return (
    <div className="slab-panel p-6 sm:p-7 space-y-5" data-testid="recurring-commitments-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100/70 pb-4">
        <div className="flex items-center gap-3">
          <div>
            <p className="editorial-kicker">FIXED COMMITMENTS</p>
            <h3 className="text-lg font-light text-slate-900 tracking-tight mt-0.5">Recurring Subscriptions & Obligations</h3>
            <p className="text-xs text-slate-500">Automated cadence detection, price hike tracking & payment forecasts</p>
          </div>
          {onExplain && (
            <button
              onClick={onExplain}
              aria-label="Explain Recurring Subscriptions"
              className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition flex items-center gap-1.5 self-start mt-1"
            >
              <Icons.Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Explain</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {list.length > 0 && (
            <span className="text-xs font-mono font-semibold text-slate-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
              Est. {formatCurrency(Math.round(totalCost))}/mo
            </span>
          )}
          <span
            className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
              list.length > 0
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {list.length} Active
          </span>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-xs space-y-2" data-testid="empty-subscriptions">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center mx-auto">
            <Icons.Refresh className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="font-bold text-slate-700">No Recurring Obligations Detected</p>
          <p className="max-w-sm mx-auto text-slate-400">Recurring payments will automatically appear here once 3+ regular transactions are recorded.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item, idx) => {
            const isHighConfidence = item.confidenceLevel === 'HIGH'
            const cadenceLabel = item.cadence ? item.cadence.charAt(0).toUpperCase() + item.cadence.slice(1) : 'Monthly'

            return (
              <div
                key={item.normalizedMerchant || idx}
                className="p-4 rounded-2xl border border-emerald-100/80 bg-white/70 hover:bg-white transition flex flex-col justify-between space-y-3 shadow-xs"
                data-testid={`subscription-card-${item.normalizedMerchant || idx}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{item.merchant}</h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {item.category || 'Subscription'} • {cadenceLabel}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                        isHighConfidence
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {item.confidenceLevel || 'MEDIUM'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-light font-mono text-slate-900">
                        {formatCurrency(item.latestAmount)}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-slate-500 ml-1">
                        /{item.cadence === 'quarterly' ? 'qtr' : item.cadence === 'weekly' ? 'wk' : 'mo'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {item.transactionCount} payments
                    </span>
                  </div>

                  {item.priceIncreaseDetected && (
                    <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-1.5" data-testid="price-increase-badge">
                      <Icons.TrendingUp className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <div>
                        <span className="font-bold">Price Increased:</span> +{formatCurrency(item.amountChange)} ({item.percentageChange > 0 ? `+${item.percentageChange}%` : ''})
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-emerald-100/70 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Next Est. Date:</span>
                  <span className="font-semibold text-slate-700">
                    {item.estimatedNextPaymentDate ? formatDate(item.estimatedNextPaymentDate) : 'Not scheduled'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RecurringCommitmentsSection
