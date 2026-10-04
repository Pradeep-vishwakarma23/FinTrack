import React from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, formatDate } from '../../utils/format'
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ReceiptText
} from '../common/Icons'

function RecentActivity({ transactions = [] }) {
  const hasTransactions = transactions && transactions.length > 0

  return (
    <section className="slab-panel p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
      <div>
        {/* Header with Direct Route Link */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <p className="editorial-kicker">LEDGER STREAM</p>
            <h3 className="text-lg sm:text-xl font-light text-slate-900 tracking-tight mt-0.5">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-500">Latest confirmed account activity</p>
          </div>

          <Link
            to="/transactions"
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 group transition"
          >
            <span>View All</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Transaction List Stream */}
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {!hasTransactions ? (
            <div className="text-center py-12 text-slate-400 text-sm space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ReceiptText size={20} />
              </div>
              <p className="text-xs text-slate-500">No recent transactions recorded for this period.</p>
            </div>
          ) : (
            transactions.map((t) => {
              const isIncome = t.type === 'income'
              return (
                <div
                  key={t._id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/70 hover:bg-white border border-emerald-100/70 hover:border-[#35D6A2]/50 shadow-2xs hover:shadow-xs transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-100/90 text-emerald-800'
                          : 'bg-rose-100/90 text-rose-800'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight size={16} strokeWidth={2.4} />
                      ) : (
                        <ArrowDownRight size={16} strokeWidth={2.4} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-900 transition-colors">
                        {t.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {t.category} • {formatDate(t.transactionDate)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-mono font-bold whitespace-nowrap px-2.5 py-1 rounded-xl shrink-0 ${
                      isIncome
                        ? 'text-emerald-900 bg-emerald-100/90 border border-emerald-300/60'
                        : 'text-rose-900 bg-rose-100/90 border border-rose-300/60'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

export default RecentActivity
