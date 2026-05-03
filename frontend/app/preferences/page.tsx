'use client'
import { useState, useEffect } from 'react'
import { api, BudgetEntry } from '@/lib/api'
import { formatINR } from '@/lib/utils'
import CategoryManager from '@/components/CategoryManager'

export default function PreferencesPage() {
  const [categories, setCategories] = useState<string[]>([])
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [cats, defaults] = await Promise.all([
          api.getCategories(),
          api.getDefaultBudget(),
        ])
        setCategories(cats)
        const init: Record<string, string> = {}
        cats.forEach((c) => { init[c] = defaults.budgets[c]?.toString() ?? '' })
        setDefaultValues(init)
      } catch {
        setLoadError('Failed to load preferences.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const defaultBudgetTotal = categories.reduce((sum, c) => {
    const n = parseFloat(defaultValues[c] ?? '')
    return sum + (Number.isFinite(n) && n > 0 ? n : 0)
  }, 0)

  function handleCategoriesChange(newCats: string[]) {
    setCategories(newCats)
    // Drop budget values for categories that were removed; preserve the rest
    setDefaultValues((prev) => {
      const next: Record<string, string> = {}
      newCats.forEach((c) => { next[c] = prev[c] ?? '' })
      return next
    })
  }

  async function handleSaveDefaults() {
    setSaving(true)
    setSaveError('')
    setSaved(false)
    try {
      const entries: BudgetEntry[] = categories
        .filter((c) => defaultValues[c] && parseFloat(defaultValues[c]) > 0)
        .map((c) => ({ category: c, amount: parseFloat(defaultValues[c]) }))
      await api.setDefaultBudget(entries)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-4 md:p-6 max-w-[800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[#e4e6f0] font-semibold text-[18px]">My Preferences</h1>
        <p className="text-[#6b7280] text-[13px] mt-1">
          Manage categories and the default monthly budget that applies when no
          month-specific override is set.
        </p>
      </div>

      {loading && (
        <div className="text-[#6b7280] text-center py-12 text-[13px]">Loading...</div>
      )}
      {loadError && <p className="text-red-400 text-[12px] mb-3">{loadError}</p>}

      {!loading && !loadError && (
        <>
          {/* ── Categories ─────────────────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-[#e4e6f0] font-semibold text-[14px] mb-3">Categories</h2>
            <CategoryManager
              categories={categories}
              onChange={handleCategoriesChange}
            />
          </section>

          {/* ── Default Budget ─────────────────────────────────────────── */}
          <section>
            <div className="mb-3">
              <h2 className="text-[#e4e6f0] font-semibold text-[14px]">Default Budget</h2>
              <p className="text-[#6b7280] text-[12px] mt-0.5">
                Applies to every month. Override a specific month from{' '}
                <span className="text-[#9ca3af]">Budget Allocation</span>.
              </p>
            </div>

            {categories.length === 0 ? (
              <p className="text-[#6b7280] text-[13px]">
                Add at least one category above before setting a default budget.
              </p>
            ) : (
              <>
                <div className="bg-[#1a1d27] border border-white/[0.07] rounded-xl overflow-hidden mb-5">
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-[#13161f] border-b border-white/[0.07]">
                        <th className="py-2.5 px-3.5 text-left text-[11px] font-medium text-[#6b7280] uppercase tracking-wider">
                          Category
                        </th>
                        <th className="py-2.5 px-3.5 text-right text-[11px] font-medium text-[#6b7280] uppercase tracking-wider">
                          Monthly Budget (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat) => (
                        <tr key={cat} className="border-b border-white/[0.04]">
                          <td className="py-3 px-3.5 text-[#e4e6f0] font-medium">{cat}</td>
                          <td className="py-3 px-3.5 flex justify-end">
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={defaultValues[cat] ?? ''}
                              onChange={(e) =>
                                setDefaultValues({ ...defaultValues, [cat]: e.target.value })
                              }
                              className="w-40 bg-[#0f1117] border border-white/[0.07] rounded-lg px-3 py-1.5 text-[#e4e6f0] text-[13px] text-right focus:outline-none focus:border-indigo-500/50"
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-indigo-500/[0.07] border-t border-indigo-500/20">
                        <td className="py-3 px-3.5 text-indigo-400 font-semibold text-[11px] uppercase tracking-wider">
                          Total
                        </td>
                        <td
                          aria-label="Default budget total"
                          className="py-3 px-3.5 text-right text-[#e4e6f0] font-semibold"
                        >
                          {formatINR(defaultBudgetTotal)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {saveError && <p className="text-red-400 text-[12px] mb-3">{saveError}</p>}

                <button
                  onClick={handleSaveDefaults}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[13px] font-medium px-6 py-2.5 rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Default Budget'}
                </button>
              </>
            )}
          </section>
        </>
      )}
    </main>
  )
}
