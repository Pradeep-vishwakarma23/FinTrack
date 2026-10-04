import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import { FinTrackLogo } from '../brand/FinTrackLogo'
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Target,
  FileText,
  UploadCloud,
  WalletCards,
  UserRound,
  LogOut
} from '../common/Icons'

function Sidebar() {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const mainNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { label: 'Insights', path: '/insights', icon: TrendingUp },
    { label: 'Goals', path: '/goals', icon: Target },
    { label: 'Reports', path: '/reports', icon: FileText }
  ]

  const secondaryNavItems = [
    { label: 'Imports', path: '/imports', icon: UploadCloud },
    { label: 'Budget', path: '/budget', icon: WalletCards },
    { label: 'Profile', path: '/profile', icon: UserRound }
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-[#0A0E17]/90 backdrop-blur-2xl text-slate-200 min-h-screen flex-col border-r border-emerald-950/70 shadow-2xl z-20 select-none transition-all duration-300 overflow-hidden">
      {/* Brand Header with Official FinTrack Logo */}
      <div className="p-5 border-b border-emerald-950/70 shrink-0 overflow-hidden">
        <Link to="/dashboard" className="flex items-center group max-w-full overflow-hidden">
          <FinTrackLogo
            variant="full"
            mode="dark"
            size={32}
            tagline="Financial Intelligence"
            showTagline={true}
            glow={true}
            className="max-w-full"
          />
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-3.5 space-y-6 overflow-y-auto">
        {/* Main Intelligence Navigation */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
            Main
          </div>
          {mainNavItems.map((item) => {
            const active = isActive(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-[#35D6A2] border border-[#35D6A2]/40 shadow-glow-mint'
                    : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-100 hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    size={17}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={`transition-colors ${
                      active ? 'text-[#35D6A2]' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#35D6A2] shadow-glow-mint animate-pulse" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Workspace Secondary Navigation */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
            Workspace
          </div>
          {secondaryNavItems.map((item) => {
            const active = isActive(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-[#35D6A2] border border-[#35D6A2]/40 shadow-glow-mint'
                    : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-100 hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    size={17}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={`transition-colors ${
                      active ? 'text-[#35D6A2]' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#35D6A2] shadow-glow-mint animate-pulse" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-emerald-950/70 bg-[#0A0E17]/80">
        <button
          onClick={handleLogout}
          type="button"
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600/20 border border-rose-500/20 active:scale-95 transition-all duration-200"
        >
          <LogOut size={15} strokeWidth={2} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar