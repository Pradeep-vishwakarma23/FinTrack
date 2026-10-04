import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  openCreateModal,
  openEditModal,
  closeModal,
  setFilterStatus,
  clearGoalError
} from '../redux/slices/goalSlice'
import { openCopilotDrawer, sendCopilotMessage } from '../redux/slices/copilotSlice'
import { formatCurrency } from '../utils/format'
import GoalSummary from '../components/goals/GoalSummary'
import GoalCard from '../components/goals/GoalCard'
import GoalFormModal from '../components/goals/GoalFormModal'
import GoalEmptyState from '../components/goals/GoalEmptyState'
import { EditorialHero, FloatingCircle, DotGrid } from '../components/common/DecorativeElements'
import { Icons } from '../components/common/Icons'

const Goals = () => {
  const dispatch = useDispatch()
  const {
    goals,
    loading,
    error,
    actionLoading,
    actionError,
    isModalOpen,
    modalMode,
    selectedGoal,
    filterStatus
  } = useSelector((state) => state.goals)

  const { month: copilotMonth } = useSelector((state) => state.copilot)
  const [goalToDelete, setGoalToDelete] = useState(null)

  useEffect(() => {
    dispatch(fetchGoals())
  }, [dispatch])

  // Filter goals based on selected status filter
  const filteredGoals = goals.filter((goal) => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'in_progress') return goal.status === 'in_progress'
    if (filterStatus === 'completed') return goal.status === 'completed' || goal.isCompleted
    if (filterStatus === 'paused') return goal.status === 'paused'
    if (filterStatus === 'cancelled') return goal.status === 'cancelled'
    return true
  })

  const handleCreateSubmit = (formData) => {
    dispatch(createGoal(formData))
  }

  const handleEditSubmit = (formData) => {
    if (selectedGoal?._id) {
      dispatch(updateGoal({ id: selectedGoal._id, data: formData }))
    }
  }

  const handleDeleteConfirm = () => {
    if (goalToDelete?._id) {
      dispatch(deleteGoal(goalToDelete._id))
      setGoalToDelete(null)
    }
  }

  const handleAskCopilot = (goal) => {
    dispatch(openCopilotDrawer())
    const prompt = `How can I achieve my goal "${goal.title}" of ${formatCurrency(goal.targetAmount)} by ${new Date(goal.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}?`
    dispatch(sendCopilotMessage({ message: prompt, month: copilotMonth }))
  }

  const filterTabs = [
    { key: 'all', label: 'All Goals', count: goals.length },
    {
      key: 'in_progress',
      label: 'Active',
      count: goals.filter((g) => g.status === 'in_progress').length
    },
    {
      key: 'completed',
      label: 'Completed',
      count: goals.filter((g) => g.status === 'completed' || g.isCompleted).length
    },
    {
      key: 'paused',
      label: 'Paused',
      count: goals.filter((g) => g.status === 'paused').length
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      count: goals.filter((g) => g.status === 'cancelled').length
    }
  ]

  return (
    <div className="space-y-8 pb-16 relative">
      <FloatingCircle size={28} className="absolute -top-4 right-1/4 animate-float-slow" />
      <DotGrid rows={3} cols={5} className="absolute top-10 right-1/3 hidden xl:grid" />

      {/* 1. Editorial Hero Statement */}
      <EditorialHero
        kicker="FUTURE HORIZONS"
        title={
          <span>
            WHAT ARE YOU <br />
            <span className="font-light italic text-slate-800">BUILDING TOWARD?</span>
          </span>
        }
        subtitle="Track deterministic progress, required monthly savings targets, and AI-grounded feasibility."
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(fetchGoals())}
            disabled={loading}
            className="px-4 py-2.5 bg-white/90 border border-emerald-200/80 text-slate-700 hover:bg-white text-xs font-semibold rounded-2xl shadow-xs transition flex items-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <Icons.Refresh className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => dispatch(openCreateModal())}
            id="open-create-goal-modal-btn"
            className="px-5 py-2.5 bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 font-bold text-xs rounded-2xl shadow-glow-mint transition flex items-center gap-2 active:scale-95"
          >
            <Icons.Plus className="w-4 h-4 text-slate-950" />
            <span>Create Goal</span>
          </button>
        </div>
      </EditorialHero>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Icons.AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => dispatch(clearGoalError())}
            className="text-rose-600 font-bold hover:text-rose-900"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Aggregate Goal Summary */}
      {goals.length > 0 && <GoalSummary goals={goals} />}

      {/* 3. Filter Navigation Tabs */}
      {goals.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-emerald-100">
          {filterTabs.map((tab) => {
            const active = filterStatus === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => dispatch(setFilterStatus(tab.key))}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  active
                    ? 'bg-slate-950 text-[#35D6A2] shadow-glow-mint border border-emerald-950'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-emerald-50/80'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    active ? 'bg-emerald-900/80 text-[#35D6A2]' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* 4. Main Content: Grid / Empty State */}
      {loading && goals.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#35D6A2] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500 font-medium">Calculating deterministic goal metrics and feasibility...</p>
        </div>
      ) : goals.length === 0 ? (
        <GoalEmptyState onCreateGoal={() => dispatch(openCreateModal())} />
      ) : filteredGoals.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-xs">
          <p className="text-sm font-semibold text-slate-700">No {filterStatus.replace('_', ' ')} goals found.</p>
          <p className="text-xs text-slate-500 mt-1">Switch filter tabs to view other goals or create a new goal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onEdit={(g) => dispatch(openEditModal(g))}
              onDelete={(g) => setGoalToDelete(g)}
              onAskCopilot={handleAskCopilot}
            />
          ))}
        </div>
      )}

      {/* 5. Create / Edit Goal Modal */}
      <GoalFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialData={selectedGoal}
        onClose={() => dispatch(closeModal())}
        onSubmit={modalMode === 'edit' ? handleEditSubmit : handleCreateSubmit}
        loading={actionLoading}
        apiError={actionError}
      />

      {/* 6. Delete Confirmation Dialog */}
      {goalToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setGoalToDelete(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-emerald-100 p-7 z-10 space-y-4 animate-fade-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Icons.Trash className="w-6 h-6 text-rose-600" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 id="delete-dialog-title" className="text-base font-bold text-slate-900">
                Delete Financial Goal?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">"{goalToDelete.title}"</strong>? This will permanently remove its tracking.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGoalToDelete(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-2xl hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-goal-btn"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-md shadow-rose-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Delete Goal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Goals
