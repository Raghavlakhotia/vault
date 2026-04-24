'use client'
import { useState, useEffect } from 'react'
import { api, BudgetEntry } from '@/lib/api'

export default function DefaultBudgetPage() {
  const [categories, setCategories] = useState<string[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

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
        setValues(init)
      } catch {
        setError('Failed to load default budget.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const entries: BudgetEntry[] = categories
        .filter((c) => values[c] && parseFloat(values[c]) > 0)
        .map((c) => ({ category: c, amount: parseFloat(values[c]) }))
      await api.setDefaultBudget(entries)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-4 md:p-6 max-w-[800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[#e4e6f0] font-semibold text-[18px]">Default Budget</h1>
        <p className="text-[#6b7280] text-[13px] mt-1">
          Applies to every month. Go to <span className="text-[#9ca3af]">Budget Allocation</span> to override a specific month.
        </p>
      </div>

      {loading && <div className="text-[#6b7280] text-center py-12 text-[13px]">Loading...</div>}
      {error && <p className="text-red-400 text-[12px] mb-3">{error}</p>}

      {!loading && categories.length === 0 && (
        <p className="text-[#6b7280] text-[13px]">No categories yet. Add some in Add Category first.</p>
      )}

      {!loading && categories.length > 0 && (
        <>
          <div className="bg-[#1a1d27] border border-white/[0.07] rounded-xl overflow-hidden mb-5">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#13161f] border-b border-white/[0.07]">
                  <th className="py-2.5 px-3.5 text-left text-[11px] font-medium text-[#6b7280] uppercase tracking-wider">Category</th>
                  <th className="py-2.5 px-3.5 text-right text-[11px] font-medium text-[#6b7280] uppercase tracking-wider">Monthly Budget (₹)</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat} className="border-b border-white/[0.04] last:border-0">
                    <td className="py-3 px-3.5 text-[#e4e6f0] font-medium">{cat}</td>
                    <td className="py-3 px-3.5 flex justify-end">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={values[cat] ?? ''}
                        onChange={(e) => setValues({ ...values, [cat]: e.target.value })}
                        className="w-40 bg-[#0f1117] border border-white/[0.07] rounded-lg px-3 py-1.5 text-[#e4e6f0] text-[13px] text-right focus:outline-none focus:border-indigo-500/50"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[13px] font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Default Budget'}
          </button>
        </>
      )}
    </main>
  )
}
