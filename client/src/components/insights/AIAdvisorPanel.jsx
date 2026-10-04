import { useState, useEffect, useCallback } from 'react'
import aiAdvisorService from '../../services/aiAdvisorService'
import { formatCurrency } from '../../utils/format'
import { Icons } from '../common/Icons'

export default function AIAdvisorPanel({ selectedMonth }) {
  // Advice State
  const [adviceData, setAdviceData] = useState(null)
  const [provider, setProvider] = useState(null)
  const [period, setPeriod] = useState(selectedMonth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Query State
  const [question, setQuestion] = useState('')
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryResult, setQueryResult] = useState(null)
  const [queryError, setQueryError] = useState(null)

  // What-If State
  const [additionalIncome, setAdditionalIncome] = useState('500')
  const [categoryReductions, setCategoryReductions] = useState({
    Other: '20',
    Shopping: '10'
  })
  const [customCategory, setCustomCategory] = useState('Food')
  const [customPercent, setCustomPercent] = useState('15')
  const [whatIfLoading, setWhatIfLoading] = useState(false)
  const [whatIfResult, setWhatIfResult] = useState(null)
  const [whatIfError, setWhatIfError] = useState(null)

  // Fetch advice when selectedMonth changes
  const fetchAdvice = useCallback(async (monthToFetch) => {
    setLoading(true)
    setError(null)
    setQueryResult(null)
    setWhatIfResult(null)
    try {
      const res = await aiAdvisorService.getAdvice(monthToFetch)
      if (res && res.success) {
        setAdviceData(res.data)
        setProvider(res.provider)
        setPeriod(res.period)
      } else {
        setError(res?.message || 'Failed to load AI financial advice.')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to connect to AI Advisor service.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      fetchAdvice(selectedMonth)
    }
  }, [selectedMonth, fetchAdvice])

  // Handle Q&A Submit
  const handleQuerySubmit = async (e, customPrompt) => {
    if (e) e.preventDefault()
    const promptToSend = customPrompt || question
    if (!promptToSend || !promptToSend.trim()) return

    setQueryLoading(true)
    setQueryError(null)
    try {
      const res = await aiAdvisorService.askQuestion(selectedMonth, promptToSend.trim())
      if (res && res.success) {
        setQueryResult(res.data)
        if (customPrompt) setQuestion(customPrompt)
      } else {
        setQueryError(res?.message || 'Failed to get answer from AI Advisor.')
      }
    } catch (err) {
      setQueryError(err.response?.data?.message || err.message || 'Error processing financial question.')
    } finally {
      setQueryLoading(false)
    }
  }

  // Handle What-If Simulation
  const handleWhatIfSubmit = async (e) => {
    if (e) e.preventDefault()
    setWhatIfLoading(true)
    setWhatIfError(null)

    // Build scenario object
    const reductions = {}
    for (const [cat, pct] of Object.entries(categoryReductions)) {
      const num = Number(pct)
      if (!isNaN(num) && num > 0) {
        reductions[cat] = num
      }
    }

    const scenario = {
      categoryReductions: reductions,
      additionalIncome: Math.max(0, Number(additionalIncome) || 0)
    }

    try {
      const res = await aiAdvisorService.runWhatIf(selectedMonth, scenario)
      if (res && res.success) {
        setWhatIfResult(res.data)
      } else {
        setWhatIfError(res?.message || 'Failed to simulate what-if scenario.')
      }
    } catch (err) {
      setWhatIfError(err.response?.data?.message || err.message || 'Error running what-if scenario.')
    } finally {
      setWhatIfLoading(false)
    }
  }

  const handleAddCategoryReduction = () => {
    if (!customCategory) return
    setCategoryReductions((prev) => ({
      ...prev,
      [customCategory]: customPercent || '10'
    }))
  }

  const handleRemoveCategoryReduction = (cat) => {
    setCategoryReductions((prev) => {
      const updated = { ...prev }
      delete updated[cat]
      return updated
    })
  }

  const isEmptyMonth =
    adviceData &&
    adviceData.executiveSummary &&
    (adviceData.executiveSummary.includes('No confirmed transactions') ||
      adviceData.executiveSummary.includes('No ledger activity') ||
      adviceData.executiveSummary.includes('Please log or confirm transactions'))

  const suggestedQuestions = [
    'What is causing my deficit?',
    'Where am I spending the most?',
    'How can I improve my savings this month?'
  ]

  return (
    <section className="slab-panel p-6 sm:p-8 space-y-8" data-testid="ai-advisor-panel">
      {/* 1. Header with Provider Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100/80 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#35D6A2] to-teal-600 flex items-center justify-center text-slate-950 shadow-glow-mint">
            <Icons.Sparkles className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-light text-slate-900 tracking-tight">AI Financial Advisor</h2>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800">
                {period || selectedMonth}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Executive financial analysis and deterministic what-if modeling
            </p>
          </div>
        </div>

        {/* Provider Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto" data-testid="provider-indicator">
          {provider === 'gemini' ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-2xs">
              <span className="inline-block w-2 h-2 rounded-full bg-[#35D6A2] animate-pulse"></span>
              <span>Powered by Gemini</span>
              <Icons.Sparkles className="w-3.5 h-3.5 text-[#1A956C]" />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Grounded Financial Intelligence</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchAdvice(selectedMonth)}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-xl transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="py-12 text-center space-y-4">
          <div className="w-8 h-8 border-3 border-[#35D6A2] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs sm:text-sm font-medium text-slate-500">
            Consulting FinTrack AI Advisor for {selectedMonth}...
          </p>
        </div>
      ) : isEmptyMonth ? (
        /* Empty Month State */
        <div className="p-8 rounded-3xl bg-white/60 border border-emerald-100 text-center space-y-2" data-testid="empty-month-state">
          <Icons.FileText className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Confirmed Financial Activity</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No confirmed financial activity is available for this month yet. Add or confirm ledger transactions to generate personalized AI advice.
          </p>
        </div>
      ) : adviceData ? (
        /* Advice Content */
        <div className="space-y-6" data-testid="advice-content">
          {/* Executive Summary & Current Financial Position */}
          <div className="p-6 rounded-3xl bg-slate-950 text-white shadow-xl space-y-3 border border-emerald-950">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#35D6A2]">
                CURRENT FINANCIAL POSITION & EXECUTIVE SUMMARY
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[#35D6A2]">
                Verified Facts
              </span>
            </div>
            <p className="text-sm md:text-base leading-relaxed text-slate-100 font-light">
              {adviceData.executiveSummary}
            </p>
          </div>

          {/* Key Observations Grid */}
          <div className="space-y-3">
            <p className="editorial-kicker">KEY OBSERVATIONS</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {adviceData.keyObservations?.map((obs, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/80 border border-emerald-100 shadow-xs flex items-start gap-3 hover:border-emerald-200 transition"
                >
                  <Icons.Search className="w-4 h-4 text-[#1A956C] mt-0.5 flex-shrink-0" />
                  <p className="text-xs leading-relaxed text-slate-700 font-medium">{obs}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations & Savings Potential Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* AI Recommendations */}
            <div className="p-6 rounded-3xl bg-emerald-50/40 border border-emerald-100 space-y-3">
              <div className="flex items-center gap-2">
                <Icons.Target className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-emerald-900">
                  AI Recommendations
                </h3>
              </div>
              <div className="space-y-2.5">
                {adviceData.actionableRecommendations?.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-emerald-100/80 shadow-xs flex items-start gap-2.5"
                  >
                    <Icons.Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Savings Potential & Projected Target */}
            <div className="p-6 rounded-3xl bg-[#35D6A2]/10 border border-[#35D6A2]/30 space-y-3">
              <div className="flex items-center gap-2">
                <Icons.Coins className="w-4 h-4 text-emerald-800" />
                <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-emerald-900">
                  Savings Potential & Targets
                </h3>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs space-y-2">
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {adviceData.savingsPotential}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. AI Financial Q&A / Chat Section */}
      <div className="border-t border-emerald-100/80 pt-6 space-y-4" data-testid="ai-query-section">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Icons.MessageSquare className="w-4 h-4 text-emerald-700" />
            <span>Ask AI Advisor About {period || selectedMonth}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ask specific questions grounded strictly in your selected month's verified financial facts.
          </p>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleQuerySubmit(e, sug)}
              disabled={queryLoading}
              className="px-3.5 py-1.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-900 border border-emerald-200/80 text-[11px] font-semibold text-slate-700 transition disabled:opacity-50 text-left flex items-center gap-1.5"
            >
              <Icons.Sparkles className="w-3 h-3 text-[#1A956C]" />
              <span>{sug}</span>
            </button>
          ))}
        </div>

        {/* Query Input Form */}
        <form onSubmit={handleQuerySubmit} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Ask about income, expenses, or categories in ${period || selectedMonth}...`}
            disabled={queryLoading}
            maxLength={500}
            className="flex-1 px-4 py-3 rounded-2xl border border-emerald-200/80 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] shadow-xs"
          />
          <button
            type="submit"
            disabled={queryLoading || !question.trim()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 text-xs font-bold shadow-glow-mint transition disabled:opacity-50 flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            {queryLoading ? (
              <>
                <Icons.Refresh className="w-3.5 h-3.5 animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <span>Ask</span>
                <Icons.ArrowRight className="w-3.5 h-3.5 text-slate-950" />
              </>
            )}
          </button>
        </form>

        {/* Query Error */}
        {queryError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <Icons.AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{queryError}</span>
          </div>
        )}

        {/* Query Result Card */}
        {queryResult && (
          <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-200/80 space-y-2.5 animate-fade-in" data-testid="query-result">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-800">
                Grounded Financial Answer
              </span>
              <span className="text-[10px] font-mono text-slate-400">Strictly verified facts</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
              {queryResult.answer}
            </p>
          </div>
        )}
      </div>

      {/* 3. Deterministic What-If Scenario Simulator */}
      <div className="border-t border-emerald-100/80 pt-6 space-y-6" data-testid="what-if-section">
        <div>
          <div className="flex items-center gap-2">
            <Icons.Sliders className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Interactive What-If Scenario Simulator
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Model the impact of trimming category budgets or adding monthly income. Deterministic calculations with AI narrative.
          </p>
        </div>

        {/* Controls Grid */}
        <div className="p-6 rounded-3xl bg-emerald-50/30 border border-emerald-100/80 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Category Reductions */}
            <div className="sm:col-span-2 space-y-2.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                Category Spending Reductions (%)
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryReductions).map(([cat, pct]) => (
                  <div
                    key={cat}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-emerald-200 text-xs shadow-2xs"
                  >
                    <span className="font-semibold text-slate-700">{cat}:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={pct}
                      onChange={(e) =>
                        setCategoryReductions((prev) => ({ ...prev, [cat]: e.target.value }))
                      }
                      className="w-12 px-1.5 py-0.5 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs font-mono font-bold text-emerald-800 text-center"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategoryReduction(cat)}
                      className="text-slate-400 hover:text-rose-600 ml-1 font-bold"
                    >
                      <Icons.X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Category Reduction */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Category (e.g. Food)"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-36 px-3 py-1.5 rounded-xl border border-emerald-200 bg-white text-xs font-medium text-slate-700"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="%"
                  value={customPercent}
                  onChange={(e) => setCustomPercent(e.target.value)}
                  className="w-16 px-2 py-1.5 rounded-xl border border-emerald-200 bg-white text-xs font-mono font-bold text-slate-700 text-center"
                />
                <button
                  type="button"
                  onClick={handleAddCategoryReduction}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-semibold transition"
                >
                  + Add Category
                </button>
              </div>
            </div>

            {/* Additional Income */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                Additional Income (₹)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  value={additionalIncome}
                  onChange={(e) => setAdditionalIncome(e.target.value)}
                  placeholder="500"
                  className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 bg-white text-xs font-mono font-bold text-emerald-800"
                />
              </div>
              <p className="text-[10px] text-slate-400">Extra monthly income or freelance cash</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleWhatIfSubmit}
              disabled={whatIfLoading}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 text-xs font-bold shadow-glow-mint transition disabled:opacity-50 flex items-center gap-2 active:scale-95"
            >
              {whatIfLoading ? (
                <>
                  <Icons.Refresh className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  <Icons.Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>Run What-If Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* What-If Error */}
        {whatIfError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <Icons.AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{whatIfError}</span>
          </div>
        )}

        {/* What-If Results Grid */}
        {whatIfResult && (
          <div className="space-y-4 animate-fade-in" data-testid="what-if-result">
            {/* Explanatory Narrative Banner */}
            {whatIfResult.narrative && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs font-medium leading-relaxed flex items-start gap-2.5">
                <Icons.Sparkles className="w-4 h-4 text-[#1A956C] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900">Scenario Narrative: </span>
                  <span>{whatIfResult.narrative}</span>
                </div>
              </div>
            )}

            {/* Baseline vs Simulated Comparison */}
            <div className="grid gap-4 sm:grid-cols-3 font-mono">
              {/* Baseline Card */}
              <div className="p-5 rounded-3xl bg-white/80 border border-emerald-100 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-100/70 pb-2">
                  <span className="text-[11px] uppercase font-bold text-slate-400 font-sans">Current Position</span>
                  <span className="text-[10px] font-semibold text-slate-500">Baseline</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Income:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(whatIfResult.baseline.income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Expenses:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(whatIfResult.baseline.expense)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Net Savings:</span>
                    <span className={`font-bold ${whatIfResult.baseline.netSavings >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatCurrency(whatIfResult.baseline.netSavings)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Savings Rate:</span>
                    <span className="font-bold text-slate-700">{whatIfResult.baseline.savingsRate}%</span>
                  </div>
                </div>
              </div>

              {/* Simulated Card */}
              <div className="p-5 rounded-3xl bg-[#35D6A2]/10 border border-[#35D6A2]/30 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#35D6A2]/20 pb-2">
                  <span className="text-[11px] uppercase font-bold text-emerald-950 font-sans">Simulated Position</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900">
                    Scenario
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Income:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(whatIfResult.simulated.income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Expenses:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(whatIfResult.simulated.expense)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Net Savings:</span>
                    <span className={`font-bold ${whatIfResult.simulated.netSavings >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatCurrency(whatIfResult.simulated.netSavings)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Savings Rate:</span>
                    <span className="font-bold text-emerald-800">{whatIfResult.simulated.savingsRate}%</span>
                  </div>
                </div>
              </div>

              {/* Improvement Card */}
              <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <span className="text-[11px] uppercase font-bold text-emerald-900 font-sans">Net Improvement</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                    Gains
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Expense Cut:</span>
                    <span className="font-bold text-emerald-700">+{formatCurrency(whatIfResult.difference.savedExpense)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Extra Income:</span>
                    <span className="font-bold text-emerald-700">+{formatCurrency(whatIfResult.difference.additionalIncome)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-emerald-200/80 font-bold">
                    <span className="text-emerald-950 font-sans">Total Gain:</span>
                    <span className="font-black text-emerald-800">+{formatCurrency(whatIfResult.difference.improvedSavings)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
