'use client'
import { useState } from 'react'
import { api, BudgetEntry } from '@/lib/api'

interface Props {
  month: string
  categories: string[]
  budgets: Record<string, number>
  onSave: () => void
}

export default function BudgetEditor({ month, categories, budgets, onSave }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    categories.forEach((c) => { init[c] = budgets[c]?.toString() ?? '' })
    return init
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const entries: BudgetEntry[] = categories
        .filter((c) => values[c] && parseFloat(values[c]) > 0)
        .map((c) => ({ category: c, amount: parseFloat(values[c]) }))
      await api.setBudgets(month, entries)
      setSaved(true)
      onSave()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
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
              <tr key={cat} className="border-b border-white/[0.04]">
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

      {error && <p className="text-red-400 text-[12px] mb-3">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[13px] font-medium px-6 py-2.5 rounded-lg transition-colors"
      >
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Budgets'}
      </button>
    </div>
  )
}
