import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchTransactions,
  removeTransactionById,
  saveTransaction,
  clearTransactionError
} from '../redux/slices/transactionSlice'
import { categories, formatCurrency, formatDate, paymentMethods } from '../utils/format'
import { EditorialHero, FloatingCircle, DotGrid } from '../components/common/DecorativeElements'
import {
  Plus,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from '../components/common/Icons'

const emptyForm = {
  type: 'expense',
  title: '',
  amount: '',
  category: 'Food',
  paymentMethod: 'upi',
  description: '',
  transactionDate: new Date().toISOString().slice(0, 10)
}

function Transactions() {
  const dispatch = useDispatch()
  const { transactions, pagination, loading, error } = useSelector((state) => state.transactions)

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    sort: 'latest',
    page: 1
  })

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')

  const query = useMemo(
    () => ({
      ...filters,
      limit: 10
    }),
    [filters]
  )

  useEffect(() => {
    dispatch(fetchTransactions(query))
  }, [dispatch, query])

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1
    }))
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      category: 'all',
      sort: 'latest',
      page: 1
    })
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (pagination.pages || 1)) {
      setFilters((prev) => ({ ...prev, page: newPage }))
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({
      ...emptyForm,
      transactionDate: new Date().toISOString().slice(0, 10)
    })
    setShowForm(true)
    setMessage('')
  }

  const openEdit = (item) => {
    setEditingId(item._id)
    setForm({
      type: item.type || 'expense',
      title: item.title || '',
      amount: item.amount || '',
      category: item.category || 'Food',
      paymentMethod: item.paymentMethod || 'upi',
      description: item.description || '',
      transactionDate: item.transactionDate
        ? new Date(item.transactionDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    })
    setShowForm(true)
    setMessage('')
  }

  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const submitForm = async (e) => {
    e.preventDefault()
    setMessage('')

    if (!form.title || form.amount === '' || Number(form.amount) < 0) {
      alert('Please fill in a valid title and non-negative amount.')
      return
    }

    try {
      await dispatch(
        saveTransaction({
          id: editingId,
          data: {
            ...form,
            amount: Number(form.amount)
          }
        })
      ).unwrap()

      setShowForm(false)
      setMessage(editingId ? 'Transaction updated successfully!' : 'Transaction created successfully!')
      dispatch(fetchTransactions(query))
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to save transaction.')
    }
  }

  const deleteItem = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      try {
        await dispatch(removeTransactionById(item._id)).unwrap()
        setMessage('Transaction deleted successfully.')
        dispatch(fetchTransactions(query))
      } catch (err) {
        alert(typeof err === 'string' ? err : 'Failed to delete transaction.')
      }
    }
  }

  return (
    <div className="space-y-8 pb-16 relative">
      <FloatingCircle size={24} className="absolute -top-4 right-1/3 animate-float-slow" />
      <DotGrid rows={3} cols={4} className="absolute top-10 right-1/4 hidden xl:grid" />

      {/* Editorial Hero Statement */}
      <EditorialHero
        kicker="LEDGER INTELLIGENCE"
        title={
          <span>
            WHERE YOUR MONEY <br />
            <span className="font-light italic text-slate-800">MOVED.</span>
          </span>
        }
        subtitle="Audit, filter, and manage confirmed ledger transactions and cash flow events."
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-100/90 text-emerald-800 font-mono text-xs font-bold border border-emerald-300/60 shadow-xs">
            {pagination.total || 0} Total Entries
          </span>
          <button
            onClick={openCreate}
            id="add-tx-btn"
            className="px-5 py-2.5 bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 font-bold text-xs rounded-2xl shadow-glow-mint transition flex items-center gap-2 active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Transaction</span>
          </button>
        </div>
      </EditorialHero>

      {/* Filter Toolbar */}
      <section className="slab-panel p-5 sm:p-6">
        <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-5">
          <div className="sm:col-span-2 md:col-span-1 relative flex items-center">
            <Search size={14} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search title or note..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-emerald-200/80 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs text-slate-800 placeholder:text-slate-400 bg-white/80"
            />
          </div>

          <div>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200/80 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs text-slate-800 bg-white/80 font-medium"
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
            </select>
          </div>

          <div>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200/80 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs text-slate-800 bg-white/80 font-medium"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200/80 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs text-slate-800 bg-white/80 font-medium"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_desc">Amount (High to Low)</option>
              <option value="amount_asc">Amount (Low to High)</option>
            </select>
          </div>

          <div>
            <button
              onClick={handleResetFilters}
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/70 text-emerald-800 text-xs font-semibold rounded-2xl transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={12} />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </section>

      {/* Status Messages */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-700" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-700 hover:text-emerald-900 font-bold">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-700" />
            <span>{error}</span>
          </div>
          <button onClick={() => dispatch(clearTransactionError())} className="text-rose-700 hover:text-rose-900 font-bold">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Transactions Ledger Table */}
      <section className="overflow-hidden slab-panel">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-emerald-50/50 border-b border-emerald-100 text-slate-500 uppercase text-[10px] tracking-widest font-mono font-bold">
              <tr>
                <th className="py-4 px-6">Event & Description</th>
                <th className="py-4 px-4">Type</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Payment</th>
                <th className="py-4 px-4 text-right">Amount</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-[#35D6A2] border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading ledger transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <div className="space-y-2">
                      <CreditCard size={28} className="mx-auto text-slate-300" />
                      <p className="text-sm font-semibold text-slate-700">No transactions match the selected criteria.</p>
                      <p className="text-xs text-slate-400">Try resetting filters or create a new entry above.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const isIncome = t.type === 'income'
                  return (
                    <tr key={t._id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900 text-xs truncate max-w-xs">{t.title}</p>
                        {t.description && <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs mt-0.5">{t.description}</p>}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${
                            isIncome ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-300/50' : 'bg-rose-100/90 text-rose-800 border border-rose-300/50'
                          }`}
                        >
                          {isIncome ? '+ Inflow' : '- Outflow'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-700 text-xs font-medium">{t.category}</td>
                      <td className="py-4 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">{formatDate(t.transactionDate)}</td>
                      <td className="py-4 px-4">
                        <span className="capitalize px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200/70 font-mono">
                          {t.paymentMethod?.replace('_', ' ') || 'Card'}
                        </span>
                      </td>
                      <td
                        className={`py-4 px-4 text-right font-mono font-bold text-xs whitespace-nowrap ${
                          isIncome ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button
                          onClick={() => openEdit(t)}
                          className="px-3 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-xl mr-1 transition inline-flex items-center gap-1"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => deleteItem(t)}
                          className="px-3 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition inline-flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-emerald-100/80 px-6 py-4 text-xs text-slate-500 bg-white/40">
          <div>
            Showing Page <span className="font-mono font-semibold text-slate-900">{pagination.page || 1}</span> of{' '}
            <span className="font-mono font-semibold text-slate-900">{pagination.pages || 1}</span> ({pagination.total || 0} total entries)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange((pagination.page || 1) - 1)}
              disabled={(pagination.page || 1) <= 1}
              className="px-3.5 py-1.5 rounded-xl border border-emerald-200/80 bg-white hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 shadow-2xs transition inline-flex items-center gap-1"
            >
              <ChevronLeft size={13} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => handlePageChange((pagination.page || 1) + 1)}
              disabled={(pagination.page || 1) >= (pagination.pages || 1)}
              className="px-3.5 py-1.5 rounded-xl border border-emerald-200/80 bg-white hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 shadow-2xs transition inline-flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* Add/Edit Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-lg border border-emerald-100 max-h-[90vh] overflow-y-auto animate-fade-slide-up">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-100 mb-6">
              <div>
                <p className="editorial-kicker">{editingId ? 'UPDATE RECORD' : 'NEW TRANSACTION'}</p>
                <h3 className="text-xl font-light text-slate-900 tracking-tight">
                  {editingId ? 'Edit Transaction Entry' : 'Record New Transaction'}
                </h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-2 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Type
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs font-semibold bg-white"
                  >
                    <option value="expense">Expense (Outflow)</option>
                    <option value="income">Income (Inflow)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    min="0"
                    step="any"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Title / Merchant
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Grocery Store, Monthly Salary"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs font-medium bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs font-medium bg-white capitalize"
                  >
                    {paymentMethods.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Transaction Date
                </label>
                <input
                  type="date"
                  name="transactionDate"
                  value={form.transactionDate}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs font-medium bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Notes (Optional)
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows="2"
                  placeholder="Additional context or references..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs font-normal"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-2xl border border-emerald-200 hover:bg-emerald-50 text-slate-700 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-[#35D6A2] hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-glow-mint transition active:scale-95"
                >
                  {editingId ? 'Save Changes' : 'Create Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions