'use client'
import { useState } from 'react'
import { ExpenseOut, api } from '@/lib/api'
import { formatINR, formatDate } from '@/lib/utils'

type Filter = 'All' | 'Husband' | 'Wife'

interface Props {
  expenses: ExpenseOut[]
  onDelete: (id: number) => void
}

export default function ExpenseTable({ expenses, onDelete }: Props) {
  const [filter, setFilter] = useState<Filter>('All')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const filtered = filter === 'All' ? expenses : expenses.filter((e) => e.paid_by === filter)

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await api.deleteExpense(id)
      onDelete(id)
    } catch {
      // deletion failed — row stays visible
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        {(['All', 'Husband', 'Wife'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-white/[0.04] text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-[12px] text-[#6b7280]">
          {filtered.length} expense{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-[#1a1d27] border border-white/[0.07] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-[#6b7280] text-[13px]">No expenses found.</div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#13161f] border-b border-white/[0.07]">
                {['Date', 'Category', 'Description', 'Paid By', 'Amount', ''].map((h, i) => (
                  <th
                    key={i}
                    className={`py-2.5 px-3.5 text-[11px] font-medium text-[#6b7280] uppercase tracking-wider ${
                      i === 4 ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className={`border-b border-white/[0.04] transition-colors ${
                    deletingId === e.id ? 'opacity-40 bg-red-500/5' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <td className="py-3 px-3.5 text-[#9ca3af]">{formatDate(e.date)}</td>
                  <td className="py-3 px-3.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#9ca3af]">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-[#e4e6f0]">{e.description || '—'}</td>
                  <td className="py-3 px-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      e.paid_by === 'Husband'
                        ? 'bg-indigo-500/15 text-indigo-300'
                        : 'bg-pink-500/10 text-pink-400'
                    }`}>
                      {e.paid_by}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-right text-red-400 font-semibold">{formatINR(e.amount)}</td>
                  <td className="py-3 px-3.5 text-right">
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={deletingId === e.id}
                      aria-label="Delete expense"
                      className="text-[#4b5563] hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
