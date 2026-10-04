import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateProfileThunk } from '../redux/slices/authSlice'
import { changePassword, getAccountStats } from '../services/authService'
import { formatCurrency } from '../utils/format'
import { EditorialHero, FloatingCircle, DotGrid } from '../components/common/DecorativeElements'
import { Icons } from '../components/common/Icons'

function Profile() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || ''
  })

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: ''
  })

  const [stats, setStats] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const fetchStats = async () => {
    try {
      const response = await getAccountStats()
      setStats(response.data.data)
    } catch (err) {
      console.error('Failed to load account stats:', err)
    }
  }

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || ''
      })
    }
    fetchStats()
  }, [user])

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value
    })
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!profile.name || !profile.email) {
      setError('Please provide both name and email.')
      return
    }

    try {
      setProfileLoading(true)
      await dispatch(updateProfileThunk(profile)).unwrap()
      setMessage('Profile details updated successfully!')
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to update profile.')
    } finally {
      setProfileLoading(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!passwords.currentPassword || !passwords.newPassword) {
      setError('Please fill in both current and new password fields.')
      return
    }

    if (passwords.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.')
      return
    }

    try {
      setPasswordLoading(true)
      await changePassword(passwords)
      setPasswords({ currentPassword: '', newPassword: '' })
      setMessage('Password changed successfully!')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to change password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-16 relative">
      <FloatingCircle size={28} className="absolute -top-4 right-1/4 animate-float-slow" />
      <DotGrid rows={3} cols={5} className="absolute top-10 right-1/3 hidden xl:grid" />

      {/* Editorial Hero */}
      <EditorialHero
        kicker="IDENTITY & SECURITY"
        title={
          <span>
            ACCOUNT & <br />
            <span className="font-light italic text-slate-800">SECURITY PROFILE.</span>
          </span>
        }
        subtitle="Manage credentials, view lifetime platform statistics, and configure personal security parameters."
      />

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Icons.Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-600 font-bold hover:text-emerald-900">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Icons.AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-600 font-bold hover:text-rose-900">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left Section: Personal Info & Password Forms */}
        <section className="space-y-8 xl:col-span-2">
          {/* Form 1: Profile Details */}
          <div className="slab-panel p-7">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center text-sm font-bold shadow-xs">
                <Icons.User className="w-4 h-4 text-emerald-700" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">User Information</h3>
                <p className="text-xs text-slate-500">Update your full name and primary login email address</p>
              </div>
            </div>

            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200/80 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs font-medium text-slate-900 bg-white shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200/80 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs font-medium text-slate-900 bg-white shadow-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 font-bold text-xs rounded-2xl shadow-glow-mint transition disabled:opacity-50 active:scale-95"
                >
                  {profileLoading ? 'Saving Profile...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Form 2: Password Update */}
          <div className="slab-panel p-7">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center text-sm font-bold shadow-xs">
                <Icons.Lock className="w-4 h-4 text-teal-700" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Security & Password</h3>
                <p className="text-xs text-slate-500">Change your account password securely</p>
              </div>
            </div>

            <form onSubmit={savePassword} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwords.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200/80 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs text-slate-900 bg-white shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    placeholder="•••••••• (min 6 chars)"
                    className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200/80 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs text-slate-900 bg-white shadow-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-sm transition disabled:opacity-50 active:scale-95"
                >
                  {passwordLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Right Section: Lifetime Account Statistics */}
        <section className="slab-panel p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center text-sm font-bold shadow-xs">
                <Icons.ShieldCheck className="w-4 h-4 text-indigo-700" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Lifetime Statistics</h3>
                <p className="text-xs text-slate-500">Aggregated platform audit</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-600">Total Transactions</span>
                <span className="text-lg font-mono font-bold text-slate-900">{stats?.transactionCount || 0}</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-800">Total Recorded Income</span>
                <span className="text-base font-mono font-bold text-emerald-800">{formatCurrency(stats?.totalIncome || 0)}</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/60 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-rose-800">Total Recorded Expenses</span>
                <span className="text-base font-mono font-bold text-rose-800">{formatCurrency(stats?.totalExpense || 0)}</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#35D6A2]/20 border border-[#35D6A2]/40 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-950">Cumulative Savings</span>
                <span className="text-base font-mono font-bold text-emerald-950">{formatCurrency(stats?.savings || 0)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-mono text-slate-400">
            Account created on:{' '}
            <strong className="text-slate-700">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'Active'}
            </strong>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Profile