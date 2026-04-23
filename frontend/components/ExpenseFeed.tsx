'use client'
import Link from 'next/link'
import { ExpenseOut } from '@/lib/api'
import { formatINR, formatDate } from '@/lib/utils'

const EMOJI: Record<string, string> = {
  Groceries: '🛒',
  'Dining Out': '🍔',
  Utilities: '⚡',
  Transport: '🚗',
  Entertainment: '🎬',
  Health: '💊',
}

interface Props {
  expenses: ExpenseOut[]
  month: string
  onAddExpense: () => void
}

export default function ExpenseFeed({ expenses, month, onAddExpense }: Props) {
  const recent = expenses.slice(0, 5)

  return (
    <div className="bg-[#1a1d27] border border-white/[0.07] rounded-xl p-4 flex flex-col">
      <div className="flex justify-between items-center mb-3.5">
        <div className="text-[11px] text-[#6b7280] uppercase tracking-widest">Recent Expenses</div>
        <Link href={`/expenses?month=${month}`} className="text-[11px] text-indigo-400 hover:text-indigo-300">
          View all →
        </Link>
      </div>
      <div className="flex-1 divide-y divide-white/[0.04]">
        {recent.length === 0 && (
          <p className="text-[#6b7280] text-center py-6 text-[13px]">No expenses this month.</p>
        )}
        {recent.map((e) => (
          <div key={e.id} className="flex items-center gap-3 py-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-sm flex-shrink-0">
              {EMOJI[e.category] ?? '💳'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[#e4e6f0] font-medium text-[13px] truncate">{e.description || e.category}</div>
              <div className="flex gap-1.5 mt-0.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[#9ca3af]">{e.category}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  e.paid_by === 'Husband' ? 'bg-indigo-500/15 text-indigo-300' : 'bg-pink-500/10 text-pink-400'
                }`}>{e.paid_by}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-red-400 font-semibold text-[13px]">{formatINR(e.amount)}</div>
              <div className="text-[10px] text-[#4b5563]">{formatDate(e.date)}</div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onAddExpense}
        className="mt-3.5 w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium py-2 rounded-lg transition-colors"
      >
        + Add Expense
      </button>
    </div>
  )
}
