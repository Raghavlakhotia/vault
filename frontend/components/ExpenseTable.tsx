'use client'
import { useState, useEffect } from 'react'
import { ExpenseOut, api } from '@/lib/api'
import { formatINR, formatDate } from '@/lib/utils'
import { paidByBadgeClass } from '@/lib/utils'

interface Props {
  expenses: ExpenseOut[]
  onDelete: (id: number) => void
  onEdit?: (expense: ExpenseOut) => void
}

export default function ExpenseTable({ expenses, onDelete, onEdit }: Props) {
  const [family, setFamily] = useState<string[]>([])
  const [filter, setFilter] = useState<string>('All')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    api.getFamily().then(setFamily).catch(() => setFamily([]))
  }, [])

  const filterOptions = ['All', ...family]
  const filtered = filter === 'All' ? expenses : expenses.filter((e) => e.paid_by === filter)

  async function handleDelete(id: number) {
    setDeletingId(id)
    setDeleteError('')
    try {
      await api.deleteExpense(id)
      onDelete(id)
    } catch {
      setDeleteError('Failed to delete expense. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {filterOptions.map((f) => (
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

      {deleteError && <p className="text-red-400 text-[12px] mb-3">{deleteError}</p>}
      <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
      <div className="min-w-[560px]">
      <div className="bg-[#1a1d27] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-[#6b7280] text-[13px]">No expenses found.</div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#13161f] border-b border-white/[0.07]">
                {['Date', 'Category', 'Description', 'Paid By', 'Source', 'Amount', ''].map((h, i) => (
                  <th
                    key={i}
                    className={`py-2.5 px-3.5 text-[11px] font-medium text-[#6b7280] uppercase tracking-wider ${
                      i === 5 ? 'text-right' : 'text-left'
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
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${paidByBadgeClass(e.paid_by)}`}>
                      {e.paid_by}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-[#9ca3af]">{e.source || '—'}</td>
                  <td className="py-3 px-3.5 text-right text-red-400 font-semibold">{formatINR(e.amount)}</td>
                  <td className="py-3 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(e)}
                          disabled={deletingId === e.id}
                          aria-label="Edit expense"
                          className="text-[#4b5563] hover:text-indigo-400 transition-colors disabled:opacity-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(e.id)}
                        disabled={deletingId === e.id}
                        aria-label="Delete expense"
                        className="text-[#4b5563] hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14H6L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>
      </div>
    </div>
  )
}
