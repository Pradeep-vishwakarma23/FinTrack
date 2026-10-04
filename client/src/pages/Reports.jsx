import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { downloadMonthlyReport, getMonthlyReport } from '../services/reportService'
import { formatCurrency, formatDate } from '../utils/format'
import { EditorialHero, FloatingCircle, DotGrid } from '../components/common/DecorativeElements'
import { Icons } from '../components/common/Icons'

const getCurrentMonthStr = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr())
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  const fetchReport = async (monthToFetch) => {
    const targetMonth = monthToFetch || selectedMonth
    try {
      setLoading(true)
      setError('')
      const response = await getMonthlyReport(targetMonth)
      setReport(response.data?.data || null)
    } catch (err) {
      console.error('Failed to load report:', err)
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load report for the selected period.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport(selectedMonth)
  }, [selectedMonth])

  const exportPdf = async () => {
    try {
      setDownloading(true)
      const response = await downloadMonthlyReport(selectedMonth)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `FinTrack_Report_${selectedMonth}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF download error:', err)
      alert('Failed to generate and download PDF report. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const categories = report?.categories || []
  const merchants = report?.merchants || []
  const budget = report?.budget
  const trends = report?.trends
  const recurring = report?.recurring || []
  const goals = report?.goals || []
  const actionPlans = report?.actionPlans || []
  const anomalies = report?.anomalies || []
  const transactions = report?.transactions || []
  const summary = report?.summary || {
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    savingsRate: 0
  }
  const txSummary = report?.transactionSummary || {
    incomeTransactions: 0,
    expenseTransactions: 0,
    transferTransactions: 0,
    totalTransactions: 0
  }

  const formattedMonthTitle = useMemo(() => {
    if (!selectedMonth) return ''
    const [y, m] = selectedMonth.split('-').map(Number)
    const d = new Date(y, m - 1, 1)
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [selectedMonth])

  return (
    <div className="space-y-8 pb-16 relative">
      <FloatingCircle size={28} className="absolute -top-4 right-1/4 animate-float-slow" />
      <DotGrid rows={3} cols={5} className="absolute top-10 right-1/3 hidden xl:grid" />

      {/* Header & Export Actions */}
      <EditorialHero
        kicker="FINANCIAL AUDIT STATEMENT"
        title={
          <span>
            UNDERSTAND <br />
            <span className="font-light italic text-slate-800">THE MONTH.</span>
          </span>
        }
        subtitle="Authoritative, deterministic financial statements, trend audits, and certified PDF exports."
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReport(selectedMonth)}
            disabled={loading}
            className="px-4 py-2.5 bg-white/90 border border-emerald-200/80 hover:bg-white text-slate-700 text-xs font-semibold rounded-2xl shadow-xs transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
            title="Refresh Report"
          >
            <Icons.Refresh className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportPdf}
            disabled={downloading || loading || !report}
            className="px-5 py-2.5 bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 font-bold text-xs rounded-2xl shadow-glow-mint transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <Icons.Download className="w-4 h-4 text-slate-950" />
            <span>{downloading ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </button>
        </div>
      </EditorialHero>

      {/* Month Selector Filter Bar */}
      <section className="slab-panel p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label
              htmlFor="month-select"
              className="text-xs font-mono font-bold text-slate-700 uppercase tracking-widest whitespace-nowrap"
            >
              Statement Cycle:
            </label>
            <input
              id="month-select"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 rounded-2xl border border-emerald-200/80 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs font-mono font-bold bg-white text-slate-800 shadow-xs"
            />
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Period Scope:</span>
            <span className="font-mono font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-xl border border-emerald-300/50">
              {formattedMonthTitle}
            </span>
          </div>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Icons.AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchReport(selectedMonth)}
            className="text-xs font-semibold underline text-rose-700 hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 space-y-3 bg-white/70 rounded-3xl border border-emerald-100 slab-panel">
          <div className="w-8 h-8 border-3 border-[#35D6A2] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-slate-600">
            Compiling verified financial ledger and intelligence for {formattedMonthTitle}...
          </p>
        </div>
      ) : report ? (
        <div className="space-y-8">
          {/* 1. Summary Metric Strip */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="slab-panel p-6">
              <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Total Income</p>
              <p className="text-3xl font-light font-mono text-slate-900 mt-2">{formatCurrency(summary.totalIncome)}</p>
              <p className="text-xs text-slate-400 mt-1">{txSummary.incomeTransactions} confirmed inflows</p>
            </div>

            <div className="slab-panel p-6">
              <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Total Expenses</p>
              <p className="text-3xl font-light font-mono text-rose-900 mt-2">{formatCurrency(summary.totalExpenses)}</p>
              <p className="text-xs text-slate-400 mt-1">{txSummary.expenseTransactions} verified outflows</p>
            </div>

            <div className="slab-panel-mint p-6">
              <p className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-widest">Net Savings</p>
              <p
                className={`text-3xl font-light font-mono mt-2 font-black ${
                  summary.netSavings >= 0 ? 'text-emerald-950' : 'text-rose-900'
                }`}
              >
                {formatCurrency(summary.netSavings)}
              </p>
              <p className="text-xs text-emerald-800/80 mt-1 font-medium">
                {summary.netSavings >= 0 ? 'Net positive period balance' : 'Active cash deficit'}
              </p>
            </div>

            <div className="slab-panel p-6">
              <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Savings Rate</p>
              <p className="text-3xl font-light font-mono text-slate-900 mt-2">{summary.savingsRate}%</p>
              <p className="text-xs text-slate-400 mt-1">Target benchmark: ≥ 20%</p>
            </div>
          </div>

          {/* 2. Budget Performance & Monthly Trends */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Budget Performance Card */}
            <section className="slab-panel p-7">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="editorial-kicker">ALLOCATION LIMITS</p>
                  <h3 className="text-xl font-light text-slate-900 tracking-tight mt-0.5">Budget Performance</h3>
                  <p className="text-xs text-slate-500">Monthly spending limits and utilization</p>
                </div>
                {budget && (
                  <span
                    className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                      budget.riskLevel === 'Exceeded'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : budget.riskLevel === 'High'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    Risk: {budget.riskLevel}
                  </span>
                )}
              </div>

              {budget ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/70">
                    <div>
                      <p className="text-[11px] font-mono text-slate-400">Budget Limit</p>
                      <p className="text-sm font-mono font-bold text-slate-900 mt-0.5">{formatCurrency(budget.monthlyBudget)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono text-slate-400">Spent</p>
                      <p className="text-sm font-mono font-bold text-rose-600 mt-0.5">{formatCurrency(budget.spent)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-mono text-slate-400">Remaining</p>
                      <p className="text-sm font-mono font-bold text-emerald-700 mt-0.5">{formatCurrency(budget.remaining)}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between text-xs font-mono font-medium text-slate-600 mb-2">
                      <span>Budget Utilization</span>
                      <span className="font-bold text-slate-900">{budget.utilization}%</span>
                    </div>
                    <div className="w-full bg-emerald-100/70 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ${
                          budget.utilization > 100
                            ? 'bg-rose-500'
                            : budget.utilization >= 90
                            ? 'bg-amber-500'
                            : 'bg-[#35D6A2] shadow-glow-mint'
                        }`}
                        style={{ width: `${Math.min(100, budget.utilization)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No monthly budget configured for this period.
                </div>
              )}
            </section>

            {/* Monthly Trend & Momentum Card */}
            <section className="slab-panel p-7">
              <div className="mb-5">
                <p className="editorial-kicker">HISTORICAL MOMENTUM</p>
                <h3 className="text-xl font-light text-slate-900 tracking-tight mt-0.5">Multi-Month Trends</h3>
                <p className="text-xs text-slate-500">Historical comparative intelligence</p>
              </div>

              {trends?.available ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100/70">
                      <p className="text-xs font-mono text-slate-400">Savings Momentum</p>
                      <p className="text-sm font-mono font-bold text-slate-900 capitalize mt-1">
                        {trends.savingsMomentum?.toLowerCase().replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100/70">
                      <p className="text-xs font-mono text-slate-400">Expense Velocity</p>
                      <p className="text-sm font-mono font-bold text-slate-900 capitalize mt-1">
                        {trends.expenseTrend}
                      </p>
                    </div>
                    <div className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100/70">
                      <p className="text-xs font-mono text-slate-400">Income Velocity</p>
                      <p className="text-sm font-mono font-bold text-slate-900 capitalize mt-1">
                        {trends.incomeTrend}
                      </p>
                    </div>
                    <div className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100/70">
                      <p className="text-xs font-mono text-slate-400">Savings Trend</p>
                      <p className="text-sm font-mono font-bold text-slate-900 capitalize mt-1">
                        {trends.savingsTrend}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Insufficient historical data for trend analysis.
                </div>
              )}
            </section>
          </div>

          {/* 3. Category Spending Breakdown Chart & Top Merchants */}
          <div className="grid gap-8 xl:grid-cols-3">
            {/* Category Chart */}
            <section className="slab-panel p-7 xl:col-span-2">
              <div className="mb-5">
                <p className="editorial-kicker">BREAKDOWN</p>
                <h3 className="text-xl font-light text-slate-900 tracking-tight mt-0.5">Category Spending Distribution</h3>
                <p className="text-xs text-slate-500">Expense distribution across categories</p>
              </div>
              <div className="h-72 w-full">
                {categories.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    No expense transactions found for this period.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categories} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E9F7F2" />
                      <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'JetBrains Mono' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        formatter={(val) => [formatCurrency(val), 'Amount']}
                        contentStyle={{ borderRadius: '16px', border: '1px solid rgba(53, 214, 162, 0.4)', background: 'rgba(255, 255, 255, 0.95)' }}
                      />
                      <Bar dataKey="amount" fill="#35D6A2" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* Top Merchants Leaderboard */}
            <section className="slab-panel p-7">
              <div className="mb-5">
                <p className="editorial-kicker">LEADERBOARD</p>
                <h3 className="text-xl font-light text-slate-900 tracking-tight mt-0.5">Top Merchants</h3>
                <p className="text-xs text-slate-500">Highest spending destinations</p>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {merchants.length === 0 ? (
                  <p className="text-slate-400 text-sm py-8 text-center">No merchant data recorded.</p>
                ) : (
                  merchants.map((m, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/60 hover:bg-white border border-emerald-100 text-xs transition"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 truncate">{m.merchant}</p>
                        <p className="text-slate-400 font-mono text-[11px]">{m.transactionCount} transactions</p>
                      </div>
                      <span className="font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(m.totalSpending)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* 4. Recurring Commitments & Financial Goals */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Recurring Commitments */}
            <section className="slab-panel p-7">
              <div className="mb-5">
                <p className="editorial-kicker">OBLIGATIONS</p>
                <h3 className="text-xl font-light text-slate-900 tracking-tight mt-0.5">Recurring Commitments</h3>
                <p className="text-xs text-slate-500">Detected subscriptions and fixed obligations</p>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {recurring.length === 0 ? (
                  <p className="text-slate-400 text-sm py-6 text-center">
                    No recurring commitments detected.
                  </p>
                ) : (
                  recurring.map((sub, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white/60 border border-emerald-100 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{sub.merchant}</p>
                        <p className="text-slate-400 capitalize font-mono text-[11px]">
                          {sub.cadence} • Next: {sub.nextExpectedPayment || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-900">{formatCurrency(sub.typicalAmount)}</p>
                        <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          {sub.confidence} confidence
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Savings Goals Progress */}
            <section className="slab-panel p-7">
              <div className="mb-5">
                <p className="editorial-kicker">TARGETS</p>
                <h3 className="text-xl font-light text-slate-900 tracking-tight mt-0.5">Savings Goals Status</h3>
                <p className="text-xs text-slate-500">Target milestones and contribution progress</p>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {goals.length === 0 ? (
                  <p className="text-slate-400 text-sm py-6 text-center">
                    No active savings goals found.
                  </p>
                ) : (
                  goals.map((g, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white/60 border border-emerald-100 text-xs space-y-2.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{g.name}</span>
                        <span className="font-mono text-slate-600 font-medium">
                          {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)} ({g.progressPercentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-emerald-100/70 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#35D6A2] h-2 rounded-full shadow-glow-mint"
                          style={{ width: `${Math.min(100, g.progressPercentage)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>Req: {formatCurrency(g.requiredMonthlySavings)}/mo</span>
                        <span className="capitalize font-semibold text-emerald-800">{g.feasibility?.toLowerCase().replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* 5. Action Plans & Anomalies */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Prioritized Action Plans */}
            <section className="slab-panel p-7">
              <div className="mb-5">
                <p className="editorial-kicker">RECOMMENDATIONS</p>
                <h3 className="text-xl font-light text-slate-900 tracking-tight mt-0.5">Prioritized Action Plans</h3>
                <p className="text-xs text-slate-500">Actionable steps with potential savings impact</p>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {actionPlans.length === 0 ? (
                  <p className="text-slate-400 text-sm py-6 text-center">
                    No active action plans for this period.
                  </p>
                ) : (
                  actionPlans.map((plan, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white/60 border border-emerald-100 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{plan.title}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                            plan.priority === 'HIGH'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {plan.priority}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">{plan.rationale}</p>
                      <div className="flex justify-between text-[11px] font-mono font-medium text-emerald-800 bg-emerald-100/70 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <span>Monthly: {formatCurrency(plan.potentialMonthlyImpact)}</span>
                        <span>6-Mo: {formatCurrency(plan.potentialSixMonthImpact)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Detected Anomalies */}
            <section className="slab-panel p-7">
              <div className="mb-5">
                <p className="editorial-kicker">AUDIT FLAGS</p>
                <h3 className="text-xl font-light text-slate-900 tracking-tight mt-0.5">Detected Anomalies</h3>
                <p className="text-xs text-slate-500">Unusual expenditures flagged for audit</p>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {anomalies.length === 0 ? (
                  <p className="text-slate-400 text-sm py-6 text-center">
                    No spending anomalies detected in this period.
                  </p>
                ) : (
                  anomalies.map((anom, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white/60 border border-emerald-100 text-xs flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{anom.merchant}</span>
                          <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                            {anom.severity}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1">{anom.reason}</p>
                      </div>
                      <span className="font-mono font-bold text-rose-600 whitespace-nowrap">
                        {formatCurrency(anom.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* 6. Period Confirmed Transactions Table */}
          <section className="slab-panel p-7">
            <div className="mb-5">
              <p className="editorial-kicker">LEDGER RECORD</p>
              <h3 className="text-xl font-light text-slate-900 tracking-tight mt-0.5">Confirmed Ledger Transactions</h3>
              <p className="text-xs text-slate-500">
                {txSummary.totalTransactions} transactions ({txSummary.incomeTransactions} Inflows, {txSummary.expenseTransactions} Outflows, {txSummary.transferTransactions} Transfers)
              </p>
            </div>

            <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
              {transactions.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 text-center">
                  No confirmed transactions recorded in this period.
                </p>
              ) : (
                transactions.map((t) => {
                  const isIncome = t.type === 'income'
                  return (
                    <div
                      key={t._id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white/60 border border-emerald-100 text-xs hover:bg-white transition"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-bold text-slate-900 truncate">{t.title}</p>
                        <p className="text-slate-400 font-mono text-[11px]">
                          {t.category} • {formatDate(t.transactionDate)}
                        </p>
                      </div>
                      <span
                        className={`font-mono font-bold whitespace-nowrap text-xs px-2.5 py-1 rounded-xl ${
                          isIncome ? 'text-emerald-800 bg-emerald-100/80' : 'text-rose-800 bg-rose-100/80'
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
          </section>
        </div>
      ) : null}
    </div>
  )
}

export default Reports