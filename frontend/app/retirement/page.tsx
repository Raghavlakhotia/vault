'use client'

import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL

// ── TypeScript interfaces ─────────────────────────────────────────────────────

interface RetirementScenario {
  name: string
  monthly_expense_today: number
  monthly_expense_at_retirement: number
  corpus_needed: number
  projected_corpus: number
  funded_pct: number
  gap: number
  gap_sip_flat: number
  gap_sip_stepup: number
  fire_age: number | null
  fire_year: number | null
}

interface RetirementResponse {
  scenarios: RetirementScenario[]
  years_to_target: number
}

interface FormState {
  current_age: number
  target_retirement_age: number
  inflation_rate: number
  current_corpus: number
  monthly_sip: number
  expenses_lean: number
  expenses_regular: number
  expenses_fat: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RetirementPage() {
  // Auth state
  const [token, setToken] = useState<string>('')
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Corpus pre-fill state
  const [corpusFromWealth, setCorpusFromWealth] = useState(false)

  // Form state
  const [form, setForm] = useState<FormState>({
    current_age: 30,
    target_retirement_age: 50,
    inflation_rate: 6,
    current_corpus: 0,
    monthly_sip: 0,
    expenses_lean: 50000,
    expenses_regular: 80000,
    expenses_fat: 120000,
  })

  // Results state
  const [results, setResults] = useState<RetirementResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [calcError, setCalcError] = useState<string | null>(null)

  // ── On mount: read token from localStorage ──────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('vault_token')
    if (stored) setToken(stored)
  }, [])

  // ── Corpus pre-fill once token is available ─────────────────────────────────
  useEffect(() => {
    if (!token) return

    async function fetchCorpus() {
      const currentMonth = new Date().toISOString().slice(0, 7)
      try {
        const res = await fetch(`${API}/api/wealth/${currentMonth}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        if (data?.totals?.total_market > 0) {
          setForm(prev => ({ ...prev, current_corpus: data.totals.total_market }))
          setCorpusFromWealth(true)
        }
      } catch {
        // silently ignore — user can fill manually
      }
    }

    fetchCorpus()
  }, [token])

  // ── Debounced calculation ───────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    const id = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API}/api/retirement/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            current_age: form.current_age,
            target_retirement_age: form.target_retirement_age,
            inflation_rate: form.inflation_rate,
            monthly_sip: form.monthly_sip,
            current_corpus: form.current_corpus,
            expenses_lean: form.expenses_lean || 1,
            expenses_regular: form.expenses_regular || 1,
            expenses_fat: form.expenses_fat || 1,
          }),
          signal: controller.signal,
        })
        if (res.ok) {
          setResults(await res.json())
          setCalcError(null)
        } else {
          const err = await res.json().catch(() => ({}))
          setCalcError(err.detail ?? 'Calculation failed')
          setResults(null)
        }
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setCalcError('Could not reach the server')
          setResults(null)
        }
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => {
      clearTimeout(id)
      controller.abort()
    }
  }, [form, token])

  // ── Login handler ───────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      })
      if (!res.ok) {
        setLoginError('Invalid credentials. Please try again.')
        return
      }
      const data = await res.json()
      const t: string = data.access_token
      localStorage.setItem('vault_token', t)
      setToken(t)
    } catch {
      setLoginError('Network error. Please try again.')
    }
  }

  // ── Helper: update a single form field ─────────────────────────────────────
  function setField<K extends keyof FormState>(key: K, value: number) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // ── Render: inline login if no token ───────────────────────────────────────
  if (!token) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50 min-h-screen px-4">
        <div className="bg-white rounded-lg shadow p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign in to Vault</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-600">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white rounded-md py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Render: main split-panel UI ─────────────────────────────────────────────
  return (
    <div className="flex flex-1 bg-gray-50 min-h-screen">
      {/* ── Left panel: input form (40%) ────────────────────────────────── */}
      <aside className="w-2/5 sticky top-0 self-start h-screen overflow-y-auto border-r border-gray-200 bg-white p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">FIRE Calculator</h1>

        {/* Basic Info */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Basic Info</h2>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Current Age</span>
              <input
                type="number"
                min={18}
                max={69}
                value={form.current_age}
                onChange={e => setField('current_age', Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Target Retirement Age</span>
              <input
                type="number"
                min={form.current_age + 1}
                max={80}
                value={form.target_retirement_age}
                onChange={e => setField('target_retirement_age', Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Inflation Rate (%)</span>
              <input
                type="number"
                min={1}
                max={20}
                step={0.1}
                value={form.inflation_rate}
                onChange={e => setField('inflation_rate', Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
          </div>
        </section>

        {/* Current Corpus */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Current Corpus</h2>
          <label className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Corpus (₹)</span>
              {corpusFromWealth && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                  from Wealth
                </span>
              )}
            </div>
            <input
              type="number"
              min={0}
              value={form.current_corpus}
              onChange={e => {
                setCorpusFromWealth(false)
                setField('current_corpus', Number(e.target.value))
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
        </section>

        {/* Monthly SIP */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Monthly SIP</h2>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">SIP Amount (₹/mo)</span>
            <input
              type="number"
              min={0}
              value={form.monthly_sip}
              onChange={e => setField('monthly_sip', Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
        </section>

        {/* Monthly Expenses */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Monthly Expenses</h2>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Lean (₹/mo)</span>
              <input
                type="number"
                min={1}
                value={form.expenses_lean}
                onChange={e => setField('expenses_lean', Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Regular (₹/mo)</span>
              <input
                type="number"
                min={1}
                value={form.expenses_regular}
                onChange={e => setField('expenses_regular', Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Fat (₹/mo)</span>
              <input
                type="number"
                min={1}
                value={form.expenses_fat}
                onChange={e => setField('expenses_fat', Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
          </div>
        </section>
      </aside>

      {/* ── Right panel: scenario cards (60%) ──────────────────────────────── */}
      <main className="w-3/5 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">FIRE Projections</h2>
        </div>

        {calcError && (
          <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg">{calcError}</div>
        )}

        {!results ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Enter inputs to see your FIRE projections
          </div>
        ) : (
          <div className="relative">
            <div className={`flex flex-col gap-6 transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {results.scenarios.map(scenario => (
                <ScenarioCard
                  key={scenario.name}
                  scenario={scenario}
                  currentAge={form.current_age}
                />
              ))}
            </div>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gray-500 text-sm font-medium">Calculating…</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Scenario card sub-component ───────────────────────────────────────────────

function ScenarioCard({
  scenario,
  currentAge,
}: {
  scenario: RetirementScenario
  currentAge: number
}) {
  const fundedPct = Math.min(Math.max(scenario.funded_pct, 0), 100)
  const isBeyond80 = scenario.fire_age === null

  // Years away: fire_age is an absolute age; subtract current age to get duration
  const yearsAway = isBeyond80 ? null : Math.max(0, (scenario.fire_age ?? 0) - currentAge)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <h3 className="text-lg font-bold text-gray-900 mb-4">{scenario.name}</h3>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5 text-sm">
        <div>
          <span className="text-gray-500">Expense today</span>
          <p className="font-semibold text-gray-900">{formatINR(scenario.monthly_expense_today)}/mo</p>
        </div>
        <div>
          <span className="text-gray-500">Expense at retirement</span>
          <p className="font-semibold text-gray-900">{formatINR(scenario.monthly_expense_at_retirement)}/mo</p>
        </div>
        <div>
          <span className="text-gray-500">Corpus needed</span>
          <p className="font-semibold text-gray-900">{formatINR(scenario.corpus_needed)}</p>
        </div>
        <div>
          <span className="text-gray-500">Projected corpus</span>
          <p className="font-semibold text-gray-900">{formatINR(scenario.projected_corpus)}</p>
        </div>
      </div>

      {/* Funded % progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-500">Funded</span>
          <span className="font-semibold text-gray-900">{fundedPct.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${fundedPct}%` }}
          />
        </div>
      </div>

      {/* FIRE timeline */}
      <div className="mb-5 text-sm">
        {isBeyond80 ? (
          <p className="text-amber-600 font-medium">Beyond 80 — consider increasing SIP or extending timeline</p>
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {yearsAway !== null && (
              <span className="text-gray-700">
                <span className="font-semibold">{yearsAway}</span>
                <span className="text-gray-500"> yrs away</span>
              </span>
            )}
            <span className="text-gray-700">
              <span className="font-semibold">FIRE age </span>
              <span>{scenario.fire_age}</span>
            </span>
            <span className="text-gray-700">
              <span className="font-semibold">FIRE year </span>
              <span>{scenario.fire_year}</span>
            </span>
          </div>
        )}
      </div>

      {/* Gap SIP */}
      <div className="border-t border-gray-100 pt-4 text-sm">
        <p className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-2">Gap SIP needed</p>
        <div className="flex gap-x-6">
          <div>
            <span className="text-gray-500">Flat</span>
            <p className="font-semibold text-gray-900">{formatINR(scenario.gap_sip_flat)}/mo</p>
          </div>
          <div>
            <span className="text-gray-500">Step-up</span>
            <p className="font-semibold text-gray-900">{formatINR(scenario.gap_sip_stepup)}/mo</p>
          </div>
        </div>
      </div>
    </div>
  )
}
