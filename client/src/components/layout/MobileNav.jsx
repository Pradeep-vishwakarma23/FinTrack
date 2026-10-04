import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Target,
  FileText
} from '../common/Icons'

function MobileNav() {
  const location = useLocation()

  const primaryTabs = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Ledger', path: '/transactions', icon: ArrowLeftRight },
    { label: 'Insights', path: '/insights', icon: TrendingUp },
    { label: 'Goals', path: '/goals', icon: Target },
    { label: 'Reports', path: '/reports', icon: FileText }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 backdrop-blur-2xl border-t border-emerald-100/90 shadow-2xl py-1.5 px-2 flex items-center justify-around safe-bottom"
    >
      {primaryTabs.map((tab) => {
        const active = isActive(tab.path)
        const Icon = tab.icon
        return (
          <Link
            key={tab.path}
            to={tab.path}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center justify-center min-h-[46px] min-w-[52px] px-2 py-1 rounded-2xl transition-all duration-200 ${
              active
                ? 'bg-emerald-50/90 text-emerald-800 border border-emerald-300/60 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 active:scale-95'
            }`}
          >
            <Icon
              size={18}
              strokeWidth={active ? 2.4 : 1.8}
              className={`transition-transform ${active ? 'scale-110 text-[#1A956C]' : 'text-slate-400'}`}
            />
            <span className={`text-[10px] tracking-tight mt-0.5 ${active ? 'font-bold text-emerald-800' : 'font-medium text-slate-500'}`}>
              {tab.label}
            </span>
            {active && (
              <span className="w-1 h-1 rounded-full bg-[#35D6A2] shadow-glow-mint mt-0.5" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export default MobileNav
