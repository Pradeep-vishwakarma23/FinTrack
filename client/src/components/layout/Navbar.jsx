import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { logout } from '../../redux/slices/authSlice'
import { FinTrackLogo } from '../brand/FinTrackLogo'
import {
  Menu,
  X,
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Target,
  FileText,
  UploadCloud,
  WalletCards,
  UserRound,
  LogOut,
  Sparkles
} from '../common/Icons'

const PAGE_TITLES = {
  '/dashboard': { title: 'Financial Command Center', subtitle: 'Real-time overview of cash flow, budget limits, and metrics' },
  '/transactions': { title: 'Ledger Transactions', subtitle: 'Audit and manage verified and confirmed transactions' },
  '/imports': { title: 'Imports & Staging Queue', subtitle: 'CSV, Excel, and SMS notification ingestion stream' },
  '/budget': { title: 'Budget Allocation', subtitle: 'Category spending caps and budget utilization thresholds' },
  '/goals': { title: 'Savings Goals', subtitle: 'Target milestones, timeline forecasts, and contribution progress' },
  '/insights': { title: 'Banking Intelligence', subtitle: 'Multi-month trends, recurring subscriptions, and action plans' },
  '/reports': { title: 'Financial Reports & Audits', subtitle: 'Deterministic statements and certified PDF exports' },
  '/profile': { title: 'Account Settings', subtitle: 'Security, multi-tenant isolation, and personal preferences' }
}

function Navbar() {
  const { user } = useSelector((state) => state.auth)
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const currentMeta = PAGE_TITLES[location.pathname] || {
    title: 'Financial Overview',
    subtitle: 'Track, budget, and optimize your wealth'
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const allNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Ledger Transactions', path: '/transactions', icon: ArrowLeftRight },
    { label: 'Financial Insights', path: '/insights', icon: TrendingUp },
    { label: 'Savings Goals', path: '/goals', icon: Target },
    { label: 'Financial Reports', path: '/reports', icon: FileText },
    { label: 'Imports & Staging', path: '/imports', icon: UploadCloud },
    { label: 'Monthly Budget', path: '/budget', icon: WalletCards },
    { label: 'Account Profile', path: '/profile', icon: UserRound }
  ]

  return (
    <>
      <nav className="bg-white/70 backdrop-blur-xl border-b border-emerald-100/70 shadow-2xs z-30 sticky top-0 transition-colors">
        <div className="px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex justify-between items-center min-h-[64px]">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open Mobile Menu"
              className="md:hidden p-2 rounded-2xl bg-white/80 border border-emerald-100 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/80 transition active:scale-95 shrink-0"
            >
              <Menu size={18} />
            </button>

            {/* Mobile Brand Logo */}
            <Link to="/dashboard" className="flex items-center md:hidden shrink-0">
              <FinTrackLogo variant="compact" mode="light" size={24} />
            </Link>

            {/* Desktop Page Title with Clean Vertical Spacing */}
            <div className="hidden md:block min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
                {currentMeta.title}
              </h2>
              <p className="text-xs text-slate-500 font-normal leading-normal mt-0.5 truncate">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-1 pr-2 sm:pr-3 rounded-2xl hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200/60 transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#35D6A2] via-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-mono font-bold text-xs shadow-glow-mint group-hover:scale-105 transition-transform">
                {userInitial}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {user?.name || 'FinTrack User'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium leading-none">
                  {user?.email || 'Verified Account'}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu for Secondary Links & Profile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-[#0A0E17]/95 backdrop-blur-2xl text-slate-200 flex flex-col h-full shadow-2xl border-r border-emerald-950/80 p-5 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-950/80 pb-4">
              <FinTrackLogo variant="compact" mode="dark" size={28} />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close Menu"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {allNavItems.map((item) => {
                const active = location.pathname === item.path
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      active
                        ? 'bg-emerald-500/20 text-[#35D6A2] border border-[#35D6A2]/40'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-[#35D6A2]' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Footer / Sign out */}
            <div className="border-t border-emerald-950/80 pt-4">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar