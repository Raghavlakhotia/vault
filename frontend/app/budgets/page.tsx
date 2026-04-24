'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { currentMonth } from '@/lib/utils'
import BudgetEditor from '@/components/BudgetEditor'

export default function BudgetsPage() {
  const searchParams = useSearchParams()
  const month = searchParams.get('month') ?? currentMonth()
  const [categories, setCategories] = useState<string[]>([])
  const [budgets, setBudgets] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [cats, budgetRes] = await Promise.all([
        api.getCategories(),
        api.getBudgets(month),
      ])
      setCategories(cats)
      setBudgets(budgetRes.budgets)
    } catch {
      setError('Failed to load budgets.')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <main className="p-6 max-w-[800px] mx-auto">
      <h1 className="text-[#e4e6f0] font-semibold text-[18px] mb-6">Budgets</h1>
      {loading && <div className="text-[#6b7280] text-center py-12 text-[13px]">Loading...</div>}
      {error && <div className="text-red-400 text-center py-12 text-[13px]">{error}</div>}
      {!loading && !error && categories.length === 0 && (
        <p className="text-[#6b7280] text-[13px]">No categories yet. Add some in the Categories page first.</p>
      )}
      {!loading && !error && categories.length > 0 && (
        <BudgetEditor month={month} categories={categories} budgets={budgets} onSave={fetchData} />
      )}
    </main>
  )
}
