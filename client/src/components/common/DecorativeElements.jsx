import React from 'react';

/**
 * Slabinskyi-inspired Decorative Elements System
 * Purely presentational geometric & atmospheric assets with aria-hidden="true"
 */

export const GlowOrb = ({ className = '', color = 'mint', size = 'w-96 h-96' }) => {
  const colorMap = {
    mint: 'bg-emerald-300/20',
    indigo: 'bg-indigo-400/15',
    teal: 'bg-teal-300/20',
    amber: 'bg-amber-300/15',
    rose: 'bg-rose-300/15'
  };

  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none rounded-full filter blur-3xl animate-pulse-glow ${colorMap[color] || colorMap.mint} ${size} ${className}`}
    />
  );
};

export const FloatingCircle = ({ size = 24, className = '', color = '#35D6A2', outline = false }) => {
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`pointer-events-none rounded-full ${outline ? 'border-2 border-dashed' : ''} ${className}`}
    >
      {!outline && (
        <div
          className="w-full h-full rounded-full opacity-70"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
};

export const FloatingTriangle = ({ size = 20, className = '', color = '#35D6A2' }) => {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`pointer-events-none opacity-60 ${className}`}
    >
      <polygon points="12,2 22,22 2,22" fill={color} />
    </svg>
  );
};

export const CurvedLine = ({ className = '', color = '#35D6A2' }) => {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute opacity-30 ${className}`}
      width="340"
      height="120"
      viewBox="0 0 340 120"
      fill="none"
    >
      <path
        d="M10 90 C 80 10, 160 110, 240 30 C 280 -10, 310 40, 330 20"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 6"
      />
    </svg>
  );
};

export const DotGrid = ({ rows = 4, cols = 6, className = '', color = '#22B886' }) => {
  return (
    <div aria-hidden="true" className={`grid gap-2 pointer-events-none opacity-30 ${className}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
};

export const FinancialCoin = ({ size = 44, symbol = '₹', className = '' }) => {
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`rounded-full bg-gradient-to-tr from-emerald-400 via-teal-300 to-emerald-100 flex items-center justify-center font-mono font-bold text-slate-900 shadow-glow-mint ${className}`}
    >
      <span style={{ fontSize: size * 0.45 }}>{symbol}</span>
    </div>
  );
};

export const FloatingCard = ({ children, className = '', delay = '0s' }) => {
  return (
    <div
      aria-hidden="true"
      style={{ animationDelay: delay }}
      className={`slab-panel p-4 shadow-card-slab pointer-events-none ${className}`}
    >
      {children}
    </div>
  );
};

export const LargeNumber = ({ number, label, className = '' }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <span className="text-6xl md:text-8xl font-light font-mono text-slate-900/10 select-none block leading-none">
        {number}
      </span>
      {label && (
        <span className="absolute bottom-1 left-2 font-mono text-xs font-semibold uppercase tracking-wider text-emerald-600">
          {label}
        </span>
      )}
    </div>
  );
};

export const EditorialHero = ({
  kicker,
  title,
  subtitle,
  children,
  badge,
  className = ''
}) => {
  return (
    <div className={`relative pt-2 pb-6 overflow-hidden ${className}`}>
      <GlowOrb color="mint" className="-top-12 -left-12 w-80 h-80 pointer-events-none" />
      <GlowOrb color="indigo" className="top-1/2 -right-12 w-72 h-72 opacity-40 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          {kicker && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300/50 mb-3 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="editorial-kicker">{kicker}</span>
            </div>
          )}
          <h1 className="editorial-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 font-light">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-600 text-base sm:text-lg font-normal max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {children && (
          <div className="flex items-center gap-3 shrink-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  GlowOrb,
  FloatingCircle,
  FloatingTriangle,
  CurvedLine,
  DotGrid,
  FinancialCoin,
  FloatingCard,
  LargeNumber,
  EditorialHero
};
