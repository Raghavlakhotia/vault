'use client'
import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { api, DashboardResponse } from '@/lib/api'
import { formatINR, currentMonth } from '@/lib/utils'
import StatCard from '@/components/StatCard'
import BudgetTable from '@/components/BudgetTable'
import ExpenseFeed from '@/components/ExpenseFeed'
import AddExpenseDrawer from '@/components/AddExpenseDrawer'

function GlanceSummary({ matrix }: { matrix: DashboardResponse['matrix'] }) {
  const over = matrix.filter((r) => r.pct_used >= 100)
  const warn = matrix.filter((r) => r.pct_used >= 80 && r.pct_used < 100)
  const topFree = [...matrix].sort((a, b) => b.remaining - a.remaining)[0]

  return (
    <div className="bg-[#1a1d27] border border-white/[0.07] rounded-xl p-4">
      <div className="text-[11px] text-[#6b7280] uppercase tracking-widest mb-3">This Month at a Glance</div>
      <div className="space-y-2 text-[13px] leading-relaxed text-[#6b7280]">
        {over.length === 0 && warn.length === 0 ? (
          <p className="text-green-400">All categories are within budget. 🎉</p>
        ) : null}
        {over.length > 0 && (
          <p>
            {over.length === 1 ? 'Category' : `${over.length} categories`}{' '}
            <span className="text-red-400">over budget</span>:{' '}
            {over.map((r) => r.category).join(', ')}.
          </p>
        )}
        {warn.length > 0 && (
          <p>
            {warn.map((r) => r.category).join(', ')}{' '}
            {warn.length === 1 ? 'is' : 'are'}{' '}
            <span className="text-amber-400">approaching the limit</span>.
          </p>
        )}
        {topFree && topFree.remaining > 0 && (
          <p>
            {topFree.category} has the most headroom —{' '}
            <span className="text-green-400">{formatINR(topFree.remaining)} free limit</span> remaining.
          </p>
        )}
      </div>
    </div>
  )
}

function DashboardInner() {
  const searchParams = useSearchParams()
  const month = searchParams.get('month') ?? currentMonth()
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api.getDashboard(month))
    } catch {
      setError('Failed to load dashboard. Is the backend running on port 8000?')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[#6b7280] text-[13px]">Loading...</div>
  }
  if (error) {
    return <div className="flex items-center justify-center h-64 text-red-400 text-[13px]">{error}</div>
  }
  if (!data) return null

  return (
    <main className="p-6 max-w-[1280px] mx-auto">
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="Monthly Budget" value={formatINR(data.totals.monthly_budget)} />
        <StatCard label="Cumulative Budget" value={formatINR(data.totals.cumulative)} valueClass="text-indigo-400" />
        <StatCard label="Total Spent" value={formatINR(data.totals.spent)} valueClass="text-red-400" />
        <StatCard
          label="Free Limit Left"
          value={data.totals.remaining < 0 ? `−${formatINR(data.totals.remaining)}` : formatINR(data.totals.remaining)}
          valueClass={data.totals.remaining >= 0 ? 'text-green-400' : 'text-red-400'}
        />
      </div>

      <div className="mb-6">
        <BudgetTable matrix={data.matrix} totals={data.totals} />
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-5">
        <GlanceSummary matrix={data.matrix} />
        <ExpenseFeed expenses={data.expenses} month={month} onAddExpense={() => setDrawerOpen(true)} />
      </div>

      <AddExpenseDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} onSuccess={fetchData} />
    </main>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-[#6b7280] text-[13px]">Loading...</div>}>
      <DashboardInner />
    </Suspense>
  )
}
