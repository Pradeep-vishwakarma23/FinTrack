import React from 'react'

/**
 * FinTrackMark: The official FinTrack ribbon 'F' with rising financial intelligence bars.
 */
export const FinTrackMark = ({ size = 36, className = '', glow = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${glow ? 'filter drop-shadow-[0_0_12px_rgba(53,214,162,0.45)]' : ''} ${className}`}
      aria-label="FinTrack Brand Mark"
    >
      <defs>
        {/* Primary Mint Gradient */}
        <linearGradient id="ft-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4EEDB6" />
          <stop offset="50%" stopColor="#35D6A2" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Deep Emerald Accent Gradient */}
        <linearGradient id="ft-grad-deep" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#35D6A2" />
          <stop offset="70%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Bar Chart Gradient */}
        <linearGradient id="ft-grad-bars" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="60%" stopColor="#35D6A2" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>
      </defs>

      {/* Outer Sweeping Top Ribbon (Upper arm of 'F') */}
      <path
        d="M 16 75 C 16 35, 30 14, 84 14 C 64 19, 44 26, 32 38 C 24 46, 22 58, 22 75 Z"
        fill="url(#ft-grad-primary)"
      />

      {/* Middle Sweeping Fold (Crossbar of 'F') */}
      <path
        d="M 22 45 C 38 43, 62 44, 76 45 C 60 51, 42 55, 28 62 C 24 56, 22 50, 22 45 Z"
        fill="url(#ft-grad-deep)"
      />

      {/* Three Rising Financial Analytics Growth Bars */}
      {/* Bar 1: Short */}
      <rect
        x="38"
        y="68"
        width="8"
        height="20"
        rx="4"
        fill="url(#ft-grad-bars)"
      />
      {/* Bar 2: Medium */}
      <rect
        x="50"
        y="56"
        width="8"
        height="32"
        rx="4"
        fill="url(#ft-grad-bars)"
      />
      {/* Bar 3: Tall */}
      <rect
        x="62"
        y="42"
        width="8"
        height="46"
        rx="4"
        fill="url(#ft-grad-bars)"
      />
    </svg>
  )
}

/**
 * FinTrackLogo: Full official logo system with multiple variants.
 * Variants:
 * - 'full': Symbol + FinTrack Wordmark + Tagline
 * - 'compact' / 'horizontal': Symbol + FinTrack Wordmark
 * - 'icon': Symbol only
 * - 'appIcon': Squircle container with symbol
 * Modes: 'light' (for white/mint background), 'dark' (for dark/obsidian background)
 */
export const FinTrackLogo = ({
  variant = 'compact',
  mode = 'dark',
  size = 36,
  tagline = 'Financial Intelligence',
  showTagline = false,
  className = '',
  glow = false
}) => {
  const isLight = mode === 'light'
  const isFull = variant === 'full' || showTagline
  const isIconOnly = variant === 'icon'
  const isAppIcon = variant === 'appIcon'

  if (isIconOnly) {
    return <FinTrackMark size={size} className={className} glow={glow} />
  }

  if (isAppIcon) {
    return (
      <div
        className={`rounded-2xl p-2.5 flex items-center justify-center shadow-glow-mint ${
          isLight
            ? 'bg-gradient-to-br from-[#E9F7F2] to-white border border-emerald-200/80 shadow-md'
            : 'bg-gradient-to-br from-[#0D1520] to-[#0A0E17] border border-emerald-500/20 shadow-xl'
        } ${className}`}
        style={{ width: size * 1.5, height: size * 1.5 }}
      >
        <FinTrackMark size={size} glow={glow} />
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 max-w-full overflow-hidden select-none ${className}`}>
      {/* Symbol */}
      <FinTrackMark size={size} glow={glow} />

      {/* Wordmark & Proportional Tagline */}
      <div className="flex flex-col min-w-0 max-w-full overflow-hidden">
        <div className="flex items-baseline gap-0.5 shrink-0">
          <span
            className={`font-black tracking-tight text-xl leading-none font-sans ${
              isLight ? 'text-slate-950' : 'text-white'
            }`}
          >
            Fin
          </span>
          <span className="font-black tracking-tight text-xl leading-none font-sans bg-gradient-to-r from-[#35D6A2] via-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Track
          </span>
          <span
            className={`text-[9px] font-mono font-bold ml-0.5 self-start -mt-0.5 ${
              isLight ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            ™
          </span>
        </div>

        {/* Official Tagline with Guaranteed Containment */}
        {isFull && (
          <p
            className={`text-[8.5px] font-mono font-semibold uppercase tracking-[0.14em] mt-0.5 truncate leading-tight max-w-full ${
              isLight ? 'text-slate-600' : 'text-emerald-400/90'
            }`}
          >
            {tagline}
          </p>
        )}
      </div>
    </div>
  )
}

export default FinTrackLogo
