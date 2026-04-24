'use client'
import { useEffect, useState } from 'react'
import { api, DashboardResponse } from '@/lib/api'
import { formatINR } from '@/lib/utils'

// Indian FY Apr 2026 – Mar 2027
const FY_MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2026, 3 + i)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})

function monthLabel(ym: string): string {
  const [year, month] = ym.split('-').map(Number)
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[month - 1]} '${String(year).slice(2)}`
}

export default function BudgetOverviewPage() {
  const [monthData, setMonthData] = useState<Record<string, DashboardResponse>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      setError('')
      try {
        const results = await Promise.all(FY_MONTHS.map((m) => api.getDashboard(m)))
        const map: Record<string, DashboardResponse> = {}
        FY_MONTHS.forEach((m, i) => { map[m] = results[i] })
        setMonthData(map)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load overview')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-[#6b7280] text-[13px]">Loading…</div>
  if (error) return <div className="flex items-center justify-center h-64 text-red-400 text-[13px]">{error}</div>

  // Collect ordered unique categories across all months
  const categorySet = new Set<string>()
  FY_MONTHS.forEach((m) => {
    monthData[m]?.matrix.forEach((row) => categorySet.add(row.category))
  })
  const categories = Array.from(categorySet)

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-screen-xl mx-auto">
      <h1 className="text-[#e4e6f0] text-[17px] font-semibold mb-5">
        Budget Overview
        <span className="ml-3 text-[13px] font-normal text-[#6b7280]">FY 2026–27 · Expenses</span>
      </h1>

      <div className="rounded-xl border border-white/[0.07] overflow-x-auto">
        <table className="text-[13px]" style={{ minWidth: `${190 + FY_MONTHS.length * 130}px`, width: '100%' }}>
          <thead className="bg-[#13161f]">
            <tr>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[#6b7280] uppercase tracking-wide sticky left-0 bg-[#13161f] z-10 min-w-[160px] border-r border-white/[0.06]">
                Category
              </th>
              {FY_MONTHS.map((m) => (
                <th key={m} className="px-4 py-2.5 text-right text-[11px] font-medium text-[#6b7280] uppercase tracking-wide min-w-[120px]">
                  {monthLabel(m)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[#1a1d27] divide-y divide-white/[0.04]">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={FY_MONTHS.length + 1} className="px-4 py-10 text-center text-[13px] text-[#6b7280]">
                  No expense data yet.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat} className="group hover:bg-white/[0.015] transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-[#1a1d27] group-hover:bg-[#1e212e] z-10 border-r border-white/[0.06] transition-colors font-medium text-[#e4e6f0]">
                    {cat}
                  </td>
                  {FY_MONTHS.map((m) => {
                    const row = monthData[m]?.matrix.find((r) => r.category === cat)
                    const spent = row?.spent ?? 0
                    if (spent === 0) {
                      return <td key={m} className="px-4 py-3 text-right text-[#3d4151]">₹0</td>
                    }
                    const overBudget = row!.cumulative > 0 && spent > row!.cumulative
                    return (
                      <td key={m} className="px-4 py-3 text-right">
                        <span className={overBudget ? 'text-red-400' : 'text-[#e4e6f0]'}>
                          {formatINR(spent)}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
          {categories.length > 0 && (
            <tfoot>
              <tr className="bg-indigo-500/[0.06] border-t border-indigo-500/20">
                <td className="px-4 py-3 text-[13px] font-semibold text-indigo-300 sticky left-0 bg-indigo-500/[0.06] z-10 border-r border-white/[0.06]">
                  Total Expenses
                </td>
                {FY_MONTHS.map((m) => {
                  const d = monthData[m]
                  const total = d?.totals.spent ?? 0
                  return (
                    <td key={m} className="px-4 py-3 text-right text-[13px] font-medium text-indigo-300">
                      {total > 0 ? formatINR(total) : <span className="text-[#3d4151]">—</span>}
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
