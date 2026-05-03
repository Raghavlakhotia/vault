'use client'
import { useState, useEffect } from 'react'
import { api, IncomeConfig, IncomeAllocation, IncomeSubAllocation, Category } from '@/lib/api'

// Static color class maps to avoid dynamic Tailwind class purging
const COLOR_CLASSES = {
  indigo: {
    stripe: 'bg-indigo-400',
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-300',
    bar: 'bg-indigo-400',
  },
  amber: {
    stripe: 'bg-amber-400',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    bar: 'bg-amber-400',
  },
  rose: {
    stripe: 'bg-rose-400',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-300',
    bar: 'bg-rose-400',
  },
} as const

type ColorKey = keyof typeof COLOR_CLASSES

interface BucketCardProps {
  name: string
  amount: number
  pct: number
  color: ColorKey
  editable: boolean
  onChange?: (amount: number) => void
  expandable?: boolean
  expanded?: boolean
  onToggle?: () => void
  subs?: IncomeSubAllocation[]
  onAddSub?: () => void
  onUpdateSub?: (idx: number, field: 'name' | 'amount', value: string | number) => void
  onDeleteSub?: (idx: number) => void
  subtitle?: string
}

function BucketCard({
  name,
  amount,
  pct,
  color,
  editable,
  onChange,
  expandable,
  expanded,
  onToggle,
  subs = [],
  onAddSub,
  onUpdateSub,
  onDeleteSub,
  subtitle,
}: BucketCardProps) {
  const cc = COLOR_CLASSES[color]

  return (
    <div className="bg-[#1a1d27] border border-white/[0.07] rounded-xl overflow-hidden">
      <div className={`h-1 ${cc.stripe}`} />
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[#e4e6f0] font-semibold text-[14px]">{name}</h3>
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${cc.badgeBg} ${cc.badgeText}`}>
            {pct.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-[#9ca3af] text-[14px]">₹</span>
          {editable ? (
            <input
              type="number"
              min="0"
              value={amount || ''}
              onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
              className="bg-transparent border-0 text-[#e4e6f0] text-[20px] font-semibold focus:outline-none w-full p-0"
              placeholder="0"
            />
          ) : (
            <span className="text-[#e4e6f0] text-[20px] font-semibold">
              {amount.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[10px] text-[#6b7280] mt-1">{subtitle}</p>
        )}
        <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
          <div
            className={`h-full ${cc.bar} transition-all duration-300`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      {expandable && (
        <div className="border-t border-white/[0.04]">
          <button
            onClick={onToggle}
            className="w-full px-4 py-2.5 text-left text-[12px] text-[#9ca3af] hover:text-[#e4e6f0] flex justify-between items-center"
          >
            <span>Sub-allocations ({subs.length})</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-2">
              {subs.map((s, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => onUpdateSub?.(idx, 'name', e.target.value)}
                    placeholder="e.g. MF1, PPF"
                    className="flex-1 bg-[#0f1117] border border-white/[0.07] rounded-lg px-3 py-1.5 text-[#e4e6f0] text-[12px] focus:outline-none focus:border-indigo-500/50"
                  />
                  <input
                    type="number"
                    min="0"
                    value={s.amount || ''}
                    onChange={(e) => onUpdateSub?.(idx, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-28 bg-[#0f1117] border border-white/[0.07] rounded-lg px-3 py-1.5 text-[#e4e6f0] text-[12px] text-right focus:outline-none focus:border-indigo-500/50"
                  />
                  <button
                    onClick={() => onDeleteSub?.(idx)}
                    aria-label={`Delete sub-allocation ${idx + 1}`}
                    className="text-[#4b5563] hover:text-red-400 transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={onAddSub}
                className="w-full py-1.5 rounded-lg border border-dashed border-white/[0.1] text-[#6b7280] hover:text-indigo-400 hover:border-indigo-400/30 text-[12px] transition-colors"
              >
                + Add sub-allocation
              </button>
              {subs.length > 0 &&
                (() => {
                  const subTotal = subs.reduce((s, x) => s + x.amount, 0)
                  const matches = Math.abs(subTotal - amount) < 0.01
                  const cls = matches
                    ? 'text-emerald-400'
                    : subTotal > amount
                    ? 'text-red-400'
                    : 'text-amber-400'
                  return (
                    <p className={`text-[11px] ${cls}`}>
                      Sub-total ₹{subTotal.toLocaleString('en-IN')} of ₹
                      {amount.toLocaleString('en-IN')}
                      {matches ? ' ✓' : subTotal > amount ? ' (over)' : ' (under)'}
                    </p>
                  )
                })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function IncomePage() {
  const [income, setIncome] = useState<IncomeConfig | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [defaultBudget, setDefaultBudget] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [investmentExpanded, setInvestmentExpanded] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getIncome(),
      api.getCategories(),
      api.getDefaultBudget(),
    ]).then(([inc, cats, def]) => {
      setIncome(inc)
      setCategories(cats)
      setDefaultBudget(def.budgets)
    }).catch(() => setError('Failed to load income config.'))
      .finally(() => setLoading(false))
  }, [])

  // Derived Need / Want totals from default budgets
  const needCategories = categories.filter((c) => c.kind === 'Need')
  const wantCategories = categories.filter((c) => c.kind === 'Want')
  const derivedNeed = needCategories.reduce((s, c) => s + (defaultBudget[c.name] || 0), 0)
  const derivedWant = wantCategories.reduce((s, c) => s + (defaultBudget[c.name] || 0), 0)

  // Effective allocations: Investment is editable; Need and Want are derived
  const effectiveAllocations = {
    Investment: income?.allocations.Investment ?? { amount: 0, subs: [] },
    Need: { amount: derivedNeed, subs: [] },
    Want: { amount: derivedWant, subs: [] },
  }

  // Derived working values
  const inHand = income?.in_hand ?? 0
  const investment: IncomeAllocation = effectiveAllocations.Investment

  // Computed real-time feedback
  const totalAllocated = effectiveAllocations.Investment.amount + derivedNeed + derivedWant
  const pct = (amount: number, total: number) => (total > 0 ? (amount / total) * 100 : 0)
  const investmentPct = pct(investment.amount, inHand)
  const needPct = pct(derivedNeed, inHand)
  const wantPct = pct(derivedWant, inHand)
  const unallocated = inHand - totalAllocated
  const mismatch: 'match' | 'under' | 'over' =
    Math.abs(unallocated) < 0.01 ? 'match' : unallocated > 0 ? 'under' : 'over'

  // Handlers — update local state only; Save persists
  function updateInHand(value: number) {
    if (!income) return
    setIncome({ ...income, in_hand: value })
  }

  function updateBucket(name: 'Investment', amount: number) {
    if (!income) return
    setIncome({
      ...income,
      allocations: {
        ...income.allocations,
        [name]: { ...income.allocations[name], amount },
      },
    })
  }

  function addSub() {
    if (!income) return
    const inv = income.allocations.Investment
    setIncome({
      ...income,
      allocations: {
        ...income.allocations,
        Investment: { ...inv, subs: [...inv.subs, { name: '', amount: 0 }] },
      },
    })
  }

  function updateSub(idx: number, field: 'name' | 'amount', value: string | number) {
    if (!income) return
    const inv = income.allocations.Investment
    const newSubs = inv.subs.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    )
    setIncome({
      ...income,
      allocations: {
        ...income.allocations,
        Investment: { ...inv, subs: newSubs },
      },
    })
  }

  function deleteSub(idx: number) {
    if (!income) return
    const inv = income.allocations.Investment
    setIncome({
      ...income,
      allocations: {
        ...income.allocations,
        Investment: { ...inv, subs: inv.subs.filter((_, i) => i !== idx) },
      },
    })
  }

  async function handleSave() {
    if (!income) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await api.setIncome({
        in_hand: income.in_hand,
        allocations: effectiveAllocations,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-4 md:p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[#e4e6f0] font-semibold text-[18px]">Income</h1>
        <p className="text-[#6b7280] text-[13px] mt-1">
          Configure how your in-hand salary gets allocated across Investment, Need, and Want buckets.
        </p>
      </div>

      {loading && (
        <div className="text-[#6b7280] text-center py-12 text-[13px]">Loading...</div>
      )}

      {!loading && error && !config && (
        <p className="text-red-400 text-[12px] mb-3">{error}</p>
      )}

      {!loading && config && (
        <>
          {/* In-hand hero card */}
          <section className="bg-[#1a1d27] border border-white/[0.07] rounded-xl p-6 mb-6">
            <label className="block text-[11px] text-[#6b7280] uppercase tracking-wider mb-2">
              In-hand Salary
            </label>
            <div className="flex items-baseline gap-2">
              <span className="text-[#9ca3af] text-[24px] font-light">₹</span>
              <input
                type="number"
                min="0"
                value={inHand || ''}
                onChange={(e) => updateInHand(parseFloat(e.target.value) || 0)}
                className="bg-transparent border-0 text-[#e4e6f0] text-[36px] font-semibold focus:outline-none w-full p-0"
                placeholder="0"
              />
            </div>
            <p className="text-[#6b7280] text-[12px] mt-2">Net amount received per month</p>
          </section>

          {/* Stacked horizontal allocation bar */}
          {inHand > 0 && (
            <section className="mb-6">
              <div className="h-3 rounded-full overflow-hidden bg-white/[0.05] flex">
                <div
                  className="bg-indigo-400 transition-all duration-300"
                  style={{ width: `${Math.min(investmentPct, 100)}%` }}
                />
                <div
                  className="bg-amber-400 transition-all duration-300"
                  style={{ width: `${Math.min(needPct, 100)}%` }}
                />
                <div
                  className="bg-rose-400 transition-all duration-300"
                  style={{ width: `${Math.min(wantPct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#9ca3af] mt-2">
                <span>
                  <span className="inline-block w-2 h-2 rounded-sm bg-indigo-400 mr-1.5 align-middle" />
                  Investment {investmentPct.toFixed(0)}%
                </span>
                <span>
                  <span className="inline-block w-2 h-2 rounded-sm bg-amber-400 mr-1.5 align-middle" />
                  Need {needPct.toFixed(0)}%
                </span>
                <span>
                  <span className="inline-block w-2 h-2 rounded-sm bg-rose-400 mr-1.5 align-middle" />
                  Want {wantPct.toFixed(0)}%
                </span>
              </div>
            </section>
          )}

          {/* Three bucket cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <BucketCard
              name="Investment"
              amount={investment.amount}
              pct={investmentPct}
              color="indigo"
              onChange={(v) => updateBucket('Investment', v)}
              expandable
              expanded={investmentExpanded}
              onToggle={() => setInvestmentExpanded((x) => !x)}
              subs={investment.subs}
              onAddSub={addSub}
              onUpdateSub={updateSub}
              onDeleteSub={deleteSub}
            />
            <BucketCard
              name="Need"
              amount={need.amount}
              pct={needPct}
              color="amber"
              onChange={(v) => updateBucket('Need', v)}
            />
            <BucketCard
              name="Want"
              amount={want.amount}
              pct={wantPct}
              color="rose"
              onChange={(v) => updateBucket('Want', v)}
            />
          </div>

          {/* Sticky footer status + Save */}
          <div className="sticky bottom-4 z-10">
            <div className="bg-[#1a1d27] border border-white/[0.1] rounded-xl px-4 py-3 flex items-center justify-between gap-4 shadow-2xl">
              <div className="flex-1 min-w-0">
                <div className="text-[#e4e6f0] text-[13px] font-medium">
                  Allocated ₹{totalAllocated.toLocaleString('en-IN')} of ₹
                  {inHand.toLocaleString('en-IN')}
                </div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    mismatch === 'match'
                      ? 'text-emerald-400'
                      : mismatch === 'under'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {mismatch === 'match' && `✓ Fully allocated`}
                  {mismatch === 'under' &&
                    `↓ ₹${Math.abs(unallocated).toLocaleString('en-IN')} unallocated`}
                  {mismatch === 'over' &&
                    `↑ ₹${Math.abs(unallocated).toLocaleString('en-IN')} over-allocated`}
                </div>
              </div>
              {error && <span className="text-red-400 text-[12px]">{error}</span>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[13px] font-medium px-5 py-2 rounded-lg transition-colors flex-shrink-0"
              >
                {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
