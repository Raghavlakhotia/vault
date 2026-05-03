'use client'
import { useState, useEffect } from 'react'
import { api, ExpenseCreate } from '@/lib/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const today = () => new Date().toISOString().slice(0, 10)
const BLANK: ExpenseCreate = { amount: 0, category: '', description: '', paid_by: '' }

const inputCls = 'w-full bg-[#1a1d27] border border-white/[0.07] rounded-lg px-3 text-[#e4e6f0] focus:outline-none focus:border-indigo-500/50'
const labelCls = 'block text-[11px] text-[#6b7280] uppercase tracking-wider mb-1.5'

export default function AddExpenseDrawer({ isOpen, onClose, onSuccess }: Props) {
  const [categories, setCategories] = useState<string[]>([])
  const [family, setFamily] = useState<string[]>([])
  const [form, setForm] = useState<ExpenseCreate & { date: string }>({ ...BLANK, date: today() })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      Promise.all([api.getCategories(), api.getFamily()]).then(([cats, fam]) => {
        setCategories(cats)
        setFamily(fam)
        setForm({ ...BLANK, paid_by: fam[0] ?? '', date: today() })
      })
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

  const fields = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelCls}>Amount (₹)</label>
        <input
          type="number" min="0.01" step="0.01"
          value={form.amount || ''}
          onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
          className={`${inputCls} py-3 text-[16px] md:text-[14px]`}
          placeholder="0" required
        />
      </div>
      <div>
        <label className={labelCls}>Category</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className={`${inputCls} py-3 text-[16px] md:text-[14px]`}
          required
        >
          <option value="">Select category</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <input
          type="text"
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={`${inputCls} py-3 text-[16px] md:text-[14px]`}
          placeholder="e.g. Zepto grocery run"
        />
      </div>
      <div>
        <label className={labelCls}>Paid By</label>
        <select
          value={form.paid_by}
          onChange={(e) => setForm({ ...form, paid_by: e.target.value })}
          className={`${inputCls} py-3 text-[16px] md:text-[14px]`}
          required
        >
          {family.length === 0 && <option value="">No family members configured</option>}
          {family.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>Date</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className={`${inputCls} py-3 text-[16px] md:text-[14px]`}
        />
      </div>
      {error && <p className="text-red-400 text-[13px]">{error}</p>}
      <button
        type="submit" disabled={saving}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3.5 md:py-2.5 text-[15px] md:text-[14px] rounded-lg transition-colors"
      >
        {saving ? 'Saving…' : 'Add Expense'}
      </button>
    </form>
  )

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Desktop: centered modal */}
      <div className="hidden md:flex absolute inset-0 items-center justify-center">
        <div className="relative bg-[#13161f] border border-white/[0.1] rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.07]">
            <h2 className="text-[#e4e6f0] font-semibold text-[15px]">Add Expense</h2>
            <button onClick={onClose} className="text-[#6b7280] hover:text-[#9ca3af] text-2xl leading-none" aria-label="Close">×</button>
          </div>
          <div className="overflow-y-auto px-6 py-5">{fields}</div>
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden absolute bottom-0 inset-x-0 bg-[#13161f] rounded-t-2xl border-t border-white/[0.1] shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="flex justify-between items-center px-5 py-3 border-b border-white/[0.07] flex-shrink-0">
          <h2 className="text-[#e4e6f0] font-semibold text-[16px]">Add Expense</h2>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#9ca3af] text-2xl leading-none" aria-label="Close">×</button>
        </div>
        <div className="overflow-y-auto px-5 pt-5 pb-8">{fields}</div>
      </div>
    </div>
  )
}
