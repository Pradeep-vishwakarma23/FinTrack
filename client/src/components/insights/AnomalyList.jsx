import React from 'react'
import { formatCurrency, formatDate } from '../../utils/format'
import { Icons } from '../common/Icons'

export const AnomalyList = ({ anomalies = [], loading, onExplain }) => {
  if (loading) {
    return (
      <div className="slab-panel p-6 animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-12 bg-slate-100 rounded-2xl"></div>
        <div className="h-12 bg-slate-100 rounded-2xl"></div>
      </div>
    )
  }

  const list = Array.isArray(anomalies) ? anomalies : []

  return (
    <div className="slab-panel p-6 sm:p-7 space-y-5">
      <div className="flex items-center justify-between border-b border-emerald-100/70 pb-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="editorial-kicker">OUTLIER AUDIT</p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">Spending Anomaly Detection</h3>
            <p className="text-xs text-slate-500">Unusual ticket sizes, budget shocks, and baseline spikes</p>
          </div>
          {onExplain && (
            <button
              onClick={onExplain}
              aria-label="Explain Spending Anomalies"
              className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition flex items-center gap-1.5 self-start mt-1"
            >
              <Icons.Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Explain</span>
            </button>
          )}
        </div>
        <span
          className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
            list.length > 0
              ? 'bg-rose-100 text-rose-800 border-rose-300'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}
        >
          {list.length} Detected
        </span>
      </div>

      {list.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center mx-auto">
            <Icons.Check className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="font-bold text-slate-700">No Spending Anomalies Detected</p>
          <p className="text-slate-400">All recorded expenses align with your historical spending baselines.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item, idx) => {
            const isHigh = item.severity === 'HIGH'
            return (
              <div
                key={item.transactionId || idx}
                className="p-4 rounded-2xl border border-emerald-100/80 bg-white/70 hover:bg-white transition space-y-2.5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.title || item.merchant}</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      {item.category} • {formatDate(item.transactionDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-rose-600">{formatCurrency(item.amount)}</p>
                    <span
                      className={`inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border mt-1 ${
                        isHigh
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {item.anomalyType || 'OUTLIER'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/70 flex items-center gap-2">
                  <Icons.AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>{item.reason}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AnomalyList
