'use client'
import { useEffect, useState } from 'react'
import { api, WealthDashboardResponse } from '@/lib/api'
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

function returnColor(ret: number, expected: number): string {
  if (ret < 0) return 'text-red-400'
  if (ret >= expected) return 'text-green-400'
  return 'text-amber-400'
}

export default function WealthOverviewPage() {
  const [monthData, setMonthData] = useState<Record<string, WealthDashboardResponse>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      setError('')
      try {
        const results = await Promise.all(FY_MONTHS.map((m) => api.getWealthDashboard(m)))
        const map: Record<string, WealthDashboardResponse> = {}
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

  const firstMonth = monthData[FY_MONTHS[0]]
  const assets = firstMonth?.rows ?? []

  if (assets.length === 0) {
    return (
      <div className="px-8 py-6 max-w-screen-xl mx-auto">
        <h1 className="text-[#e4e6f0] text-[17px] font-semibold mb-2">Wealth Overview</h1>
        <p className="text-[#6b7280] text-[13px]">No assets yet. Add one via Wealth → Add Asset.</p>
      </div>
    )
  }

  const sortedAssets = [...assets].sort((a, b) => {
    if (a.category !== b.category) return a.category === 'Equity' ? -1 : 1
    return a.asset_name.localeCompare(b.asset_name)
  })

  return (
    <div className="px-8 py-6 max-w-screen-xl mx-auto">
      <h1 className="text-[#e4e6f0] text-[17px] font-semibold mb-5">
        Wealth Overview
        <span className="ml-3 text-[13px] font-normal text-[#6b7280]">FY 2026–27</span>
      </h1>

      <div className="rounded-xl border border-white/[0.07] overflow-x-auto">
        <table className="text-[13px]" style={{ minWidth: `${200 + FY_MONTHS.length * 140}px`, width: '100%' }}>
          <thead className="bg-[#13161f]">
            <tr>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[#6b7280] uppercase tracking-wide sticky left-0 bg-[#13161f] z-10 min-w-[190px] border-r border-white/[0.06]">
                Asset
              </th>
              {FY_MONTHS.map((m) => (
                <th key={m} className="px-4 py-2.5 text-right text-[11px] font-medium text-[#6b7280] uppercase tracking-wide min-w-[130px]">
                  {monthLabel(m)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[#1a1d27] divide-y divide-white/[0.04]">
            {sortedAssets.map((asset) => (
              <tr key={asset.asset_id} className="group hover:bg-white/[0.015] transition-colors">
                <td className="px-4 py-3 sticky left-0 bg-[#1a1d27] group-hover:bg-[#1e212e] z-10 border-r border-white/[0.06] transition-colors">
                  <div className="text-[#e4e6f0] font-medium">{asset.asset_name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[11px] ${asset.category === 'Equity' ? 'text-indigo-400' : 'text-amber-400'}`}>
                      {asset.category}
                    </span>
                    <span className="text-[10px] text-[#4b5563]">· {asset.expected_return}% exp</span>
                  </div>
                </td>
                {FY_MONTHS.map((m) => {
                  const row = monthData[m]?.rows.find((r) => r.asset_id === asset.asset_id)
                  if (!row || row.holding_id === null) {
                    return <td key={m} className="px-4 py-3 text-right text-[#3d4151]">—</td>
                  }
                  return (
                    <td key={m} className="px-4 py-3 text-right">
                      <div className="text-[#e4e6f0]">{formatINR(row.market_value)}</div>
                      {row.returns !== null && (
                        <div className={`text-[11px] mt-0.5 ${returnColor(row.returns, row.expected_return)}`}>
                          {row.returns >= 0 ? '+' : ''}{row.returns.toFixed(1)}%
                          {row.use_expected_return && <span className="text-[#4b5563] ml-0.5">~</span>}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-emerald-500/[0.06] border-t border-emerald-500/20">
              <td className="px-4 py-3 text-[13px] font-semibold text-emerald-300 sticky left-0 bg-emerald-500/[0.06] z-10 border-r border-white/[0.06]">
                Net Worth
              </td>
              {FY_MONTHS.map((m) => {
                const d = monthData[m]
                const hasData = d?.rows.some((r) => r.holding_id !== null)
                return (
                  <td key={m} className="px-4 py-3 text-right text-[13px] font-medium text-emerald-300">
                    {hasData ? formatINR(d!.totals.total_market) : <span className="text-[#3d4151]">—</span>}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
