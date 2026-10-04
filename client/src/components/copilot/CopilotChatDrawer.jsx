import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  sendCopilotMessage,
  openCopilotDrawer,
  closeCopilotDrawer,
  startNewConversation,
  clearCopilotErrors
} from '../../redux/slices/copilotSlice'
import { getCurrentMonthKey } from '../../redux/slices/insightSlice'
import { GlowOrb } from '../common/DecorativeElements'
import { FinTrackMark } from '../brand/FinTrackLogo'
import {
  Sparkles,
  Plus,
  X,
  Send,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
  Zap,
  Bot
} from '../common/Icons'

export const CopilotChatDrawer = () => {
  const dispatch = useDispatch()
  const {
    isDrawerOpen,
    messages,
    loading,
    error,
    provider,
    month: copilotMonth
  } = useSelector((state) => state.copilot)

  const { period: insightPeriod } = useSelector((state) => state.insights)
  const activeMonth = copilotMonth || insightPeriod || getCurrentMonthKey()

  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [messages, isDrawerOpen, loading])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        dispatch(closeCopilotDrawer())
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch, isDrawerOpen])

  const handleSendMessage = (textToSend) => {
    const message = (typeof textToSend === 'string' ? textToSend : inputMessage).trim()
    if (!message || loading) return

    if (message.length > 500) return

    dispatch(sendCopilotMessage({ message, month: activeMonth }))
    setInputMessage('')
  }

  const handleKeyDownInput = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMonthDisplay = (monthStr) => {
    if (!monthStr || !monthStr.includes('-')) return monthStr
    const [y, m] = monthStr.split('-')
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const defaultStarterPrompts = [
    'How can I save more this month?',
    'Why did spending increase?',
    'What should I do next?',
    'What happens if I reduce top category by 20%?'
  ]

  return (
    <>
      {/* Floating Glowing FinTrack AI Orb Launcher (Safe-Area Aware on Mobile) */}
      {!isDrawerOpen && (
        <button
          onClick={() => dispatch(openCopilotDrawer())}
          aria-label="Open AI Financial Copilot Chat"
          id="copilot-floating-launcher"
          className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-40 flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-[#0A0E17]/95 via-[#121E24]/95 to-[#0A0E17]/95 backdrop-blur-xl text-white font-bold text-xs sm:text-sm rounded-full shadow-glow-mint hover:shadow-glow-mint-lg hover:scale-105 active:scale-95 transition-all duration-300 border border-[#35D6A2]/40 group"
        >
          <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-[#35D6A2] to-teal-300 text-slate-950 font-black text-xs shadow-glow-mint">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35D6A2] opacity-75"></span>
            <Sparkles size={13} strokeWidth={2.5} className="text-slate-950" />
          </div>
          <span className="font-semibold tracking-tight text-white group-hover:text-[#35D6A2] transition-colors">
            FinTrack Copilot
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#35D6A2] border border-[#35D6A2]/30">
            AI
          </span>
        </button>
      )}

      {/* Backdrop for Focus */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-md z-40 transition-opacity"
          onClick={() => dispatch(closeCopilotDrawer())}
          aria-hidden="true"
        />
      )}

      {/* Copilot Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI Financial Copilot Chat Drawer"
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[460px] md:w-[500px] bg-[#0A0E17]/95 backdrop-blur-2xl text-slate-100 flex flex-col shadow-2xl border-l border-emerald-950/80 transform transition-transform duration-300 ease-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <GlowOrb color="mint" className="top-10 right-0 w-64 h-64 opacity-25" />
        <GlowOrb color="indigo" className="bottom-20 left-0 w-72 h-72 opacity-20" />

        {/* Header */}
        <div className="p-5 border-b border-emerald-950/80 bg-[#0A0E17]/80 relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0D1520] to-[#131E2B] border border-emerald-500/30 flex items-center justify-center shadow-glow-mint">
              <FinTrackMark size={24} glow={true} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">FinTrack Copilot</h2>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                    provider === 'gemini'
                      ? 'bg-emerald-500/20 text-[#35D6A2] border-[#35D6A2]/40'
                      : 'bg-emerald-500/15 text-[#35D6A2] border-emerald-500/30'
                  }`}
                >
                  {provider === 'gemini' ? 'Gemini Mode' : 'AI Intelligence • Grounded'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#35D6A2] shadow-glow-mint"></span>
                Ledger Context: <span className="text-slate-200 font-semibold">{formatMonthDisplay(activeMonth)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => dispatch(startNewConversation())}
              title="Start New Conversation"
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition border border-slate-700/60 flex items-center gap-1"
            >
              <Plus size={13} />
              <span>New</span>
            </button>
            <button
              onClick={() => dispatch(closeCopilotDrawer())}
              aria-label="Close Copilot Drawer"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-transparent text-sm relative z-10">
          {/* Empty Conversation State */}
          {messages.length === 0 && (
            <div className="py-8 text-center space-y-5">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-[#35D6A2] border border-[#35D6A2]/30 flex items-center justify-center mx-auto shadow-glow-mint">
                <MessageSquare size={26} className="text-[#35D6A2]" />
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-slate-100 text-base">How can I assist your finances?</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Ask multi-turn financial questions grounded strictly in your verified {formatMonthDisplay(activeMonth)} ledger data.
                </p>
              </div>

              {/* Starter Suggestions */}
              <div className="space-y-2 pt-3">
                <p className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">Suggested Queries</p>
                <div className="flex flex-col gap-2">
                  {defaultStarterPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-[#35D6A2]/40 text-xs text-slate-300 hover:text-white transition-all group flex items-center justify-between"
                    >
                      <span>{prompt}</span>
                      <ArrowRight size={14} className="text-slate-500 group-hover:text-[#35D6A2] transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Render Message History */}
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id || index}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5 animate-fade-slide-up`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 font-medium rounded-br-none shadow-glow-mint'
                      : 'bg-slate-900/90 text-slate-100 rounded-bl-none border border-emerald-950/80 shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Suggested Follow-up chips */}
                {!isUser && Array.isArray(msg.suggestedFollowUps) && msg.suggestedFollowUps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 pl-1 max-w-[95%]">
                    {msg.suggestedFollowUps.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => handleSendMessage(chip)}
                        disabled={loading}
                        className="text-[11px] font-medium px-3 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-[#35D6A2] border border-[#35D6A2]/30 hover:border-[#35D6A2]/60 transition active:scale-95 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Zap size={11} />
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-start space-y-1.5">
              <div className="p-4 rounded-3xl rounded-bl-none bg-slate-900/90 border border-emerald-950/80 text-slate-300 text-xs flex items-center gap-2.5">
                <div className="w-4 h-4 border-2 border-[#35D6A2] border-t-transparent rounded-full animate-spin"></div>
                <span>Synthesizing confirmed ledger facts...</span>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} />
                <span>{error}</span>
              </div>
              <button
                onClick={() => dispatch(clearCopilotErrors())}
                className="text-rose-400 hover:text-white font-bold ml-2"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-emerald-950/80 bg-[#0A0E17]/95 relative z-10 space-y-2">
          <div className="relative flex items-center">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value.slice(0, 500))}
              onKeyDown={handleKeyDownInput}
              placeholder={`Ask about ${formatMonthDisplay(activeMonth)} finances... (Enter to send)`}
              disabled={loading}
              className="w-full bg-slate-900 border border-emerald-950 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] focus:border-transparent resize-none pr-12 disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputMessage.trim()}
              aria-label="Send Message"
              className="absolute right-3 bottom-4 p-2 bg-[#35D6A2] hover:bg-emerald-400 active:bg-emerald-500 disabled:opacity-30 text-slate-950 font-bold rounded-xl transition shadow-glow-mint flex items-center justify-center"
            >
              <Send size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono">
            <span>Shift+Enter for newline</span>
            <span>{inputMessage.length}/500</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default CopilotChatDrawer
