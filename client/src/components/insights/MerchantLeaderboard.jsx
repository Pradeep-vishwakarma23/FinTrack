import React from 'react'
import { formatCurrency } from '../../utils/format'
import { Icons } from '../common/Icons'

export const MerchantLeaderboard = ({ merchants = [], loading, onExplain }) => {
  if (loading) {
    return (
      <div className="slab-panel p-6 animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-10 bg-slate-100 rounded-2xl"></div>
        <div className="h-10 bg-slate-100 rounded-2xl"></div>
      </div>
    )
  }

  const list = Array.isArray(merchants) ? merchants : []

  return (
    <div className="slab-panel p-6 sm:p-7 space-y-5">
      <div className="flex items-center justify-between border-b border-emerald-100/70 pb-4">
        <div>
          <p className="editorial-kicker">COUNTERPARTIES</p>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">Top Merchants & Payees</h3>
          <p className="text-xs text-slate-500">Highest volume recipients and average transaction sizes</p>
        </div>
        {onExplain && (
          <button
            type="button"
            onClick={() => onExplain({ contextType: 'merchant_concentration', itemData: { merchants: list } })}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/60 px-3 py-1.5 rounded-xl transition shadow-2xs"
            aria-label="Explain merchant concentration"
          >
            <Icons.Sparkles className="w-3.5 h-3.5 text-[#1A956C]" />
            <span>Explain</span>
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs font-medium">
          No merchant transaction records found for this period.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((m, idx) => (
            <div
              key={m.merchant || idx}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 hover:bg-white border border-emerald-100/80 transition shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="truncate">
                  <p className="text-sm font-bold text-slate-900 truncate">{m.merchant}</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {m.count} {m.count === 1 ? 'transaction' : 'transactions'} • Avg: {formatCurrency(m.averageTicket)}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-mono font-bold text-slate-900">{formatCurrency(m.totalSpend)}</p>
                <p className="text-[11px] font-mono text-slate-500 font-semibold">{m.percentage}% of expenses</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MerchantLeaderboard
