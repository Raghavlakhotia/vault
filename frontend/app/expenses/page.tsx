'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { api, ExpenseOut } from '@/lib/api'
import { currentMonth } from '@/lib/utils'
import ExpenseTable from '@/components/ExpenseTable'
import AddExpenseDrawer from '@/components/AddExpenseDrawer'

export default function ExpensesPage() {
  const searchParams = useSearchParams()
  const month = searchParams.get('month') ?? currentMonth()
  const [expenses, setExpenses] = useState<ExpenseOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getExpenses(month)
      setExpenses(data.sort((a, b) => b.date.localeCompare(a.date)))
    } catch {
      setError('Failed to load expenses.')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <main className="p-6 max-w-[1280px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[#e4e6f0] font-semibold text-[18px]">Expenses</h1>
        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Expense
        </button>
      </div>

      {loading && <div className="text-[#6b7280] text-center py-12 text-[13px]">Loading...</div>}
      {error && <div className="text-red-400 text-center py-12 text-[13px]">{error}</div>}
      {!loading && !error && (
        <ExpenseTable
          expenses={expenses}
          onDelete={(id) => setExpenses((prev) => prev.filter((e) => e.id !== id))}
        />
      )}

      <AddExpenseDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} onSuccess={fetchData} />
    </main>
  )
}
