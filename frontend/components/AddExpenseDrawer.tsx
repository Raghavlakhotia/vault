'use client'
import { useState, useEffect } from 'react'
import { api, ExpenseCreate } from '@/lib/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const today = () => new Date().toISOString().slice(0, 10)
const BLANK: ExpenseCreate = { amount: 0, category: '', description: '', paid_by: 'Husband' }

export default function AddExpenseDrawer({ isOpen, onClose, onSuccess }: Props) {
  const [categories, setCategories] = useState<string[]>([])
  const [form, setForm] = useState<ExpenseCreate & { date: string }>({ ...BLANK, date: today() })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      api.getCategories().then(setCategories)
      setForm({ ...BLANK, date: today() })
      setError('')
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.category) { setError('Please select a category'); return }
    if (!form.amount || form.amount <= 0) { setError('Amount must be positive'); return }
    setSaving(true)
    setError('')
    try {
      await api.createExpense(form)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#13161f] border border-white/[0.1] rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.07]">
          <h2 className="text-[#e4e6f0] font-semibold text-[15px]">Add Expense</h2>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#9ca3af] text-2xl leading-none" aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-[11px] text-[#6b7280] uppercase tracking-wider mb-1.5">Amount (₹)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount || ''}
              onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              className="w-full bg-[#1a1d27] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[#e4e6f0] text-[14px] focus:outline-none focus:border-indigo-500/50"
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#6b7280] uppercase tracking-wider mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-[#1a1d27] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[#e4e6f0] text-[14px] focus:outline-none focus:border-indigo-500/50"
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#6b7280] uppercase tracking-wider mb-1.5">Description</label>
            <input
              type="text"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#1a1d27] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[#e4e6f0] text-[14px] focus:outline-none focus:border-indigo-500/50"
              placeholder="e.g. Zepto grocery run"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#6b7280] uppercase tracking-wider mb-1.5">Paid By</label>
            <select
              value={form.paid_by}
              onChange={(e) => setForm({ ...form, paid_by: e.target.value })}
              className="w-full bg-[#1a1d27] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[#e4e6f0] text-[14px] focus:outline-none focus:border-indigo-500/50"
            >
              <option value="Husband">Husband</option>
              <option value="Wife">Wife</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#6b7280] uppercase tracking-wider mb-1.5">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full bg-[#1a1d27] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[#e4e6f0] text-[14px] focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {error && <p className="text-red-400 text-[12px]">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Add Expense'}
          </button>
        </form>
      </div>
    </div>
  )
}
