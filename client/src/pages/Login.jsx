import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser } from '../redux/slices/authSlice'
import { FinTrackLogo } from '../components/brand/FinTrackLogo'
import { Icons } from '../components/common/Icons'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  const { loading } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Please enter your email and password.')
      return
    }

    try {
      const result = await dispatch(loginUser(formData)).unwrap()
      if (result) {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to sign in. Please check your credentials.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Mint Atmospheric Background Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#35D6A2]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md border border-emerald-100/80">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <FinTrackLogo variant="full" size="md" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in to access your financial intelligence dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <Icons.AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-2xl border border-emerald-200/80 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs text-slate-900 bg-white placeholder:text-slate-400 transition"
            />
          </div>

          <div>
            <label className="block font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-2xl border border-emerald-200/80 focus:outline-none focus:ring-2 focus:ring-[#35D6A2] text-xs text-slate-900 bg-white placeholder:text-slate-400 transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#35D6A2] to-teal-500 hover:from-[#22B886] hover:to-teal-600 text-slate-950 font-bold text-xs shadow-glow-mint transition duration-150 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Icons.Refresh className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login