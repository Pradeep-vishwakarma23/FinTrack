import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBudget, saveBudget, clearBudgetError } from '../redux/slices/budgetSlice'
import { getDashboardSummary } from '../services/dashboardService'
import { categories, formatCurrency } from '../utils/format'
import { EditorialHero, FloatingCircle, DotGrid } from '../components/common/DecorativeElements'
import { Icons } from '../components/common/Icons'

function Budget() {
  const dispatch = useDispatch()
  const budgetState = useSelector((state) => state.budget)

  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [categoryBudgets, setCategoryBudgets] = useState([])
  const [summary, setSummary] = useState(null)
  const [message, setMessage] = useState('')
  const [localLoading, setLocalLoading] = useState(false)

  const loadData = async () => {
    try {
      await dispatch(fetchBudget()).unwrap()
      const sumRes = await getDashboardSummary()
      setSummary(sumRes.data.data)
    } catch (err) {
      console.error('Error loading budget details:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [dispatch])

  useEffect(() => {
    if (budgetState) {
      setMonthlyBudget(budgetState.monthlyBudget || '')
      setCategoryBudgets(budgetState.categories || [])
    }
  }, [budgetState.monthlyBudget, budgetState.categories])

  const addCategory = () => {
    const existing = categoryBudgets.map((c) => c.category)
    const available = categories.find((c) => !existing.includes(c)) || 'Other'
    setCategoryBudgets([...categoryBudgets, { category: available, limit: 1000 }])
  }

  const updateCategory = (index, field, value) => {
    const updated = [...categoryBudgets]
    updated[index] = {
      ...updated[index],
      [field]: field === 'limit' ? Math.max(0, Number(value) || 0) : value
    }
    setCategoryBudgets(updated)
  }

  const removeCategory = (index) => {
    setCategoryBudgets(categoryBudgets.filter((_, i) => i !== index))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setMessage('')
    setLocalLoading(true)

    try {
      await dispatch(
        saveBudget({
          monthlyBudget: Number(monthlyBudget) || 0,
          categoryBudgets
        })
      ).unwrap()

      const sumRes = await getDashboardSummary()
      setSummary(sumRes.data.data)
      setMessage('Budget configuration saved successfully!')
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to save budget settings.')
    } finally {
      setLocalLoading(false)
    }
  }

  const totalExpense = summary?.totalExpense || 0
  const numMonthlyBudget = Number(monthlyBudget) || 0
  const remaining = numMonthlyBudget > 0 ? numMonthlyBudget - totalExpense : -totalExpense
  const usedPercent = numMonthlyBudget > 0 ? (totalExpense / numMonthlyBudget) * 100 : 0

  return (
    <div className="space-y-8 pb-16 relative">
      <FloatingCircle size={28} className="absolute -top-4 right-1/4 animate-float-slow" />
      <DotGrid rows={3} cols={5} className="absolute top-10 right-1/3 hidden xl:grid" />

      {/* Editorial Hero Statement */}
      <EditorialHero
        kicker="ALLOCATION CONTROL"
        title={
          <span>
            GUARDRAILS FOR <br />
            <span className="font-light italic text-slate-800">YOUR CASH FLOW.</span>
          </span>
        }
        subtitle="Establish monthly limits and category allocations to proactively safeguard your savings."
      />

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Icons.Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-600 font-bold hover:text-emerald-900">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      )}

      {budgetState.error && (
        <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Icons.AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{budgetState.error}</span>
          </div>
          <button onClick={() => dispatch(clearBudgetError())} className="text-rose-600 font-bold hover:text-rose-900">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left Section: Budget Formulation Form */}
        <section className="slab-panel p-7 xl:col-span-2">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-2">
                Total Monthly Budget (₹)
              </label>
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="e.g. 50000"
                min="0"
                step="any"
                required
                className="w-full px-4 py-3 rounded-2xl border border-emerald-200/80 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-lg font-mono font-bold text-slate-900 bg-white shadow-xs"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Your target spending ceiling across all categories for the calendar month.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Category Budgets</h3>
                  <p className="text-xs text-slate-500">Allocate individual limits for key spending categories</p>
                </div>
                <button
                  type="button"
                  onClick={addCategory}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200/80 transition flex items-center gap-1.5 active:scale-95"
                >
                  <Icons.Plus className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Add Category</span>
                </button>
              </div>

              <div className="space-y-4">
                {categoryBudgets.length === 0 ? (
                  <div className="p-8 rounded-3xl border border-dashed border-emerald-200 text-center text-slate-400 text-xs bg-emerald-50/20">
                    No category budgets configured yet. Click "Add Category" above to specify limits.
                  </div>
                ) : (
                  categoryBudgets.map((cb, idx) => {
                    const match = summary?.categoryBreakdown?.find(
                      (c) => c.category.toLowerCase() === cb.category.toLowerCase()
                    )
                    const spent = match ? match.amount : 0
                    const limitNum = Number(cb.limit) || 0
                    const percent = limitNum > 0 ? (spent / limitNum) * 100 : 0
                    const isOver = percent >= 100

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-emerald-100 bg-white/70 space-y-3 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1">
                            <select
                              value={cb.category}
                              onChange={(e) => updateCategory(idx, 'category', e.target.value)}
                              className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35D6A2]"
                            >
                              {categories.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-500 font-medium">Limit: ₹</span>
                            <input
                              type="number"
                              value={cb.limit}
                              onChange={(e) => updateCategory(idx, 'limit', e.target.value)}
                              min="0"
                              step="any"
                              className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 text-xs font-mono font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#35D6A2]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCategory(idx)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                            title="Remove Category"
                          >
                            <Icons.Trash className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
                            <span>
                              Spent: <strong className="text-slate-800">{formatCurrency(spent)}</strong> of {formatCurrency(limitNum)}
                            </span>
                            <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-600 font-medium'}>
                              {percent.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-emerald-100/70 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isOver ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-[#35D6A2] shadow-glow-mint'
                              }`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={budgetState.loading || localLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 font-bold text-xs shadow-glow-mint transition disabled:opacity-50 active:scale-95"
            >
              {budgetState.loading || localLoading ? 'Saving Budget Settings...' : 'Save Budget Configuration'}
            </button>
          </form>
        </section>

        {/* Right Section: Monthly Budget Utilization Summary */}
        <section className="slab-panel p-7 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Monthly Progress</h3>
            <p className="text-xs text-slate-500 mb-6">Real-time expenditure vs monthly target</p>

            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Total Spent So Far</p>
                <p className="text-2xl font-light font-mono text-slate-900 mt-1">{formatCurrency(totalExpense)}</p>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  remaining < 0
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                }`}
              >
                <p className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">Remaining Balance</p>
                <p className="text-2xl font-light font-mono mt-1 font-black">{formatCurrency(remaining)}</p>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono font-semibold text-slate-700 mb-2">
                  <span>Budget Utilization</span>
                  <span className="font-bold">{usedPercent.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-emerald-100/70 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      usedPercent >= 100
                        ? 'bg-rose-600'
                        : usedPercent >= 80
                        ? 'bg-amber-500'
                        : 'bg-[#35D6A2] shadow-glow-mint'
                    }`}
                    style={{ width: `${Math.min(usedPercent, 100)}%` }}
                  ></div>
                </div>
              </div>

              {remaining < 0 && (
                <div className="p-4 rounded-2xl bg-rose-100/80 border border-rose-300 text-rose-900 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Icons.AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                    <span>Budget Limit Exceeded</span>
                  </p>
                  <p>You have surpassed your total monthly budget. Consider reducing unnecessary expenses.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-mono text-slate-400">
            Limits are dynamically evaluated against all recorded expense transactions for the current period.
          </div>
        </section>
      </div>
    </div>
  )
}

export default Budget