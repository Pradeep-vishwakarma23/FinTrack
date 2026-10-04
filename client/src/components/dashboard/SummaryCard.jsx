import React, { useRef } from 'react'
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  WalletCards
} from '../common/Icons'

function SummaryCard({ label, value, subtext, icon, tone = 'slate', isHero = false }) {
  const cardRef = useRef(null)

  const toneStyles = {
    slate: {
      card: 'slab-panel text-slate-900',
      badge: 'bg-slate-100 text-slate-700',
      val: 'text-slate-900',
      iconBg: 'bg-slate-100 text-slate-600'
    },
    green: {
      card: 'slab-panel-mint text-emerald-950',
      badge: 'bg-emerald-100/90 text-emerald-800',
      val: 'text-emerald-950 font-black',
      iconBg: 'bg-[#35D6A2] text-slate-950 shadow-glow-mint'
    },
    red: {
      card: 'slab-panel text-rose-950 hover:border-rose-300/80',
      badge: 'bg-rose-100/80 text-rose-800',
      val: 'text-rose-900',
      iconBg: 'bg-rose-100 text-rose-700'
    },
    blue: {
      card: 'slab-panel text-teal-950 hover:border-teal-300/80',
      badge: 'bg-teal-100/80 text-teal-800',
      val: 'text-teal-900',
      iconBg: 'bg-teal-100 text-teal-700'
    }
  }

  const currentTone = toneStyles[tone] || toneStyles.slate

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cardRef.current.style.setProperty('--mouse-x', `${x}px`)
    cardRef.current.style.setProperty('--mouse-y', `${y}px`)
  }

  // Render icon component or fallback
  const renderIcon = () => {
    if (!icon) return null
    if (typeof icon === 'function' || React.isValidElement(icon)) {
      return icon
    }
    // If a string or emoji passed, map to clean Lucide icon
    if (icon === '💰' || icon === 'savings') return <Coins size={18} strokeWidth={2} />
    if (icon === '📈' || icon === 'income') return <TrendingUp size={18} strokeWidth={2} />
    if (icon === '📉' || icon === 'expense') return <TrendingDown size={18} strokeWidth={2} />
    if (icon === '🛡️' || icon === 'budget') return <ShieldCheck size={18} strokeWidth={2} />
    return <WalletCards size={18} strokeWidth={2} />
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`p-6 transition-all duration-300 card-spotlight ${currentTone.card} ${
        isHero ? 'sm:col-span-2 xl:col-span-2' : ''
      }`}
    >
      <div className="flex items-center justify-between relative z-10">
        <p className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        {icon && (
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${currentTone.iconBg}`}>
            {renderIcon()}
          </div>
        )}
      </div>
      <p className={`mt-3 text-3xl sm:text-4xl font-light font-mono tracking-tight relative z-10 ${currentTone.val}`}>
        {value}
      </p>
      {subtext && (
        <p className="mt-2 text-xs text-slate-600 font-normal leading-relaxed relative z-10">
          {subtext}
        </p>
      )}
    </div>
  )
}

export default SummaryCard
