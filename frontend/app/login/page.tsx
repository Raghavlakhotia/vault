'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { isLoggedIn } from '@/lib/auth'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isLoggedIn()) router.replace('/')
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        await authApi.login(username, password)
      } else {
        await authApi.register(username, password)
      }
      router.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-indigo-400 font-bold text-[28px] tracking-widest">VAULT</span>
          <p className="text-[#6b7280] text-[13px] mt-1">Household budget manager</p>
        </div>

        {/* Card */}
        <div className="bg-[#13161f] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
          {/* Toggle */}
          <div className="flex bg-[#1a1d27] rounded-lg p-1 mb-6">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  mode === m
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-[#6b7280] hover:text-[#9ca3af]'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] text-[#6b7280] uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                required
                placeholder="e.g. lakhotia"
                className="w-full bg-[#1a1d27] border border-white/[0.07] rounded-lg px-3 py-3 text-[16px] md:text-[14px] text-[#e4e6f0] placeholder-[#4b5563] focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#6b7280] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                placeholder="••••••••"
                className="w-full bg-[#1a1d27] border border-white/[0.07] rounded-lg px-3 py-3 text-[16px] md:text-[14px] text-[#e4e6f0] placeholder-[#4b5563] focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {error && (
              <p className="text-red-400 text-[13px] bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3.5 text-[15px] rounded-lg transition-colors mt-1"
            >
              {loading ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
