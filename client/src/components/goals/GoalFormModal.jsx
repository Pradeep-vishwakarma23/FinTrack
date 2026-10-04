import React, { useState, useEffect } from 'react'
import { Icons } from '../common/Icons'

const CATEGORY_OPTIONS = [
  'General',
  'Emergency Fund',
  'Savings',
  'Travel & Vacation',
  'Home & Real Estate',
  'Vehicle',
  'Education',
  'Gadgets & Tech',
  'Investments',
  'Debt Payoff',
  'Retirement',
  'Other'
]

const GoalFormModal = ({
  isOpen,
  mode = 'create', // 'create' | 'edit'
  initialData = null,
  onClose,
  onSubmit,
  loading = false,
  apiError = ''
}) => {
  // Format initial target date to YYYY-MM-DD
  const formatInitialDate = (d) => {
    if (!d) {
      // Default to 6 months in the future
      const future = new Date()
      future.setMonth(future.getMonth() + 6)
      return future.toISOString().split('T')[0]
    }
    try {
      const date = new Date(d)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: formatInitialDate(),
    category: 'General',
    priority: 'medium',
    status: 'in_progress',
    monthlyTarget: '',
    notes: ''
  })

  const [errors, setErrors] = useState({})

  // Populate data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          title: initialData.title || '',
          targetAmount: initialData.targetAmount !== undefined ? String(initialData.targetAmount) : '',
          currentAmount: initialData.currentAmount !== undefined ? String(initialData.currentAmount) : '0',
          targetDate: formatInitialDate(initialData.targetDate),
          category: initialData.category || 'General',
          priority: initialData.priority || 'medium',
          status: initialData.status || 'in_progress',
          monthlyTarget: initialData.monthlyTarget ? String(initialData.monthlyTarget) : '',
          notes: initialData.notes || ''
        })
      } else {
        setFormData({
          title: '',
          targetAmount: '',
          currentAmount: '0',
          targetDate: formatInitialDate(),
          category: 'General',
          priority: 'medium',
          status: 'in_progress',
          monthlyTarget: '',
          notes: ''
        })
      }
      setErrors({})
    }
  }, [isOpen, mode, initialData])

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  const validate = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Goal title is required.'
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters.'
    }

    const numTarget = Number(formData.targetAmount)
    if (!formData.targetAmount || isNaN(numTarget) || numTarget < 1) {
      newErrors.targetAmount = 'Target amount must be at least ₹1.'
    }

    const numCurrent = Number(formData.currentAmount)
    if (formData.currentAmount !== '' && (isNaN(numCurrent) || numCurrent < 0)) {
      newErrors.currentAmount = 'Current amount cannot be negative.'
    }

    if (!formData.targetDate) {
      newErrors.targetDate = 'Target date is required.'
    } else {
      const selected = new Date(formData.targetDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (isNaN(selected.getTime())) {
        newErrors.targetDate = 'Invalid date format.'
      } else if (mode === 'create' && selected <= today) {
        newErrors.targetDate = 'Target date must be in the future.'
      }
    }

    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      title: formData.title.trim(),
      targetAmount: Number(formData.targetAmount),
      currentAmount: Number(formData.currentAmount || 0),
      targetDate: formData.targetDate,
      category: formData.category,
      priority: formData.priority,
      status: formData.status,
      monthlyTarget: formData.monthlyTarget ? Number(formData.monthlyTarget) : 0,
      notes: formData.notes.trim()
    }

    onSubmit(payload)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-base font-bold shadow-xs">
              <Icons.Target className="w-5 h-5 text-emerald-700" />
            </span>
            <div>
              <h2 id="goal-modal-title" className="text-base font-bold text-slate-900">
                {mode === 'edit' ? 'Edit Financial Goal' : 'Create Financial Goal'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'edit'
                  ? 'Update target parameters and saved contributions'
                  : 'Define your savings goal with automatic feasibility checking'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        {/* API Error Message */}
        {apiError && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <Icons.AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label htmlFor="goal-title" className="block font-semibold text-slate-700 mb-1">
              Goal Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="goal-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Emergency Fund, Japan Trip, Down Payment"
              maxLength={100}
              disabled={loading}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                errors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50/40'
              }`}
            />
            {errors.title && <p className="text-rose-600 text-[11px] mt-1">{errors.title}</p>}
          </div>

          {/* Target Amount & Current Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="goal-target-amount" className="block font-semibold text-slate-700 mb-1">
                Target Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                id="goal-target-amount"
                type="number"
                min="1"
                step="any"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="50000"
                disabled={loading}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                  errors.targetAmount ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50/40'
                }`}
              />
              {errors.targetAmount && <p className="text-rose-600 text-[11px] mt-1">{errors.targetAmount}</p>}
            </div>

            <div>
              <label htmlFor="goal-current-amount" className="block font-semibold text-slate-700 mb-1">
                Current Saved (₹)
              </label>
              <input
                id="goal-current-amount"
                type="number"
                min="0"
                step="any"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                placeholder="0"
                disabled={loading}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                  errors.currentAmount ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50/40'
                }`}
              />
              {errors.currentAmount && <p className="text-rose-600 text-[11px] mt-1">{errors.currentAmount}</p>}
            </div>
          </div>

          {/* Target Date & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="goal-target-date" className="block font-semibold text-slate-700 mb-1">
                Target Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="goal-target-date"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                disabled={loading}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                  errors.targetDate ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 bg-slate-50/40'
                }`}
              />
              {errors.targetDate && <p className="text-rose-600 text-[11px] mt-1">{errors.targetDate}</p>}
            </div>

            <div>
              <label htmlFor="goal-category" className="block font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                id="goal-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="goal-priority" className="block font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                id="goal-priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            {mode === 'edit' ? (
              <div>
                <label htmlFor="goal-status" className="block font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  id="goal-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="goal-monthly-target" className="block font-semibold text-slate-700 mb-1">
                  Optional Monthly Target (₹)
                </label>
                <input
                  id="goal-monthly-target"
                  type="number"
                  min="0"
                  step="any"
                  value={formData.monthlyTarget}
                  onChange={(e) => setFormData({ ...formData, monthlyTarget: e.target.value })}
                  placeholder="e.g. 5000"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="goal-notes" className="block font-semibold text-slate-700 mb-1">
              Notes & Strategy (Optional)
            </label>
            <textarea
              id="goal-notes"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any specific context or savings rule for this goal..."
              maxLength={500}
              disabled={loading}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/40 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition"
            />
            <p className="text-[10px] text-slate-400 text-right mt-0.5">
              {formData.notes.length}/500
            </p>
          </div>

          {/* Actions Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-goal-form-btn"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 font-bold rounded-xl shadow-glow-mint transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
              <span>{mode === 'edit' ? 'Save Changes' : 'Create Goal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GoalFormModal
