'use client'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { api, WealthDashboardResponse } from '@/lib/api'
import { currentMonth, formatINR } from '@/lib/utils'
import WealthTable from '@/components/WealthTable'
import StatCard from '@/components/StatCard'

function WealthInner() {
  const searchParams = useSearchParams()
  const month = searchParams.get('month') ?? currentMonth()

  const [data, setData] = useState<WealthDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api.getWealthDashboard(month))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wealth data')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDeleteHolding(id: number) {
    await api.deleteHolding(id)
    fetchData()
  }

  async function handleEditHolding(id: number, invested: number, market: number, useExp: boolean) {
    await api.updateHolding(id, { invested_value: invested, market_value: market, use_expected_return: useExp })
    fetchData()
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-[#6b7280] text-[13px]">Loading…</div>
  if (error) return <div className="flex items-center justify-center h-64 text-red-400 text-[13px]">{error}</div>
  if (!data) return null

  const { totals, rows } = data
  const pctReturn = totals.total_invested > 0
    ? ((totals.total_market - totals.total_invested) / totals.total_invested) * 100
    : null
  const equityInvested = rows.filter((r) => r.category === 'Equity').reduce((s, r) => s + r.invested_value, 0)
  const equityPct = totals.total_invested > 0 ? (equityInvested / totals.total_invested) * 100 : null

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-6xl mx-auto">
      <h1 className="text-[#e4e6f0] text-[17px] font-semibold mb-5">
        Wealth Dashboard
        <span className="ml-3 text-[13px] font-normal text-[#6b7280]">{month}</span>
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Net Invested"
          value={formatINR(totals.total_invested)}
          valueClass="text-[#e4e6f0]"
        />
        <StatCard
          label="Net Worth"
          value={formatINR(totals.total_market)}
          valueClass="text-indigo-400"
        />
        <StatCard
          label="% Return"
          value={pctReturn !== null ? `${pctReturn >= 0 ? '+' : ''}${pctReturn.toFixed(1)}%` : '—'}
          valueClass={pctReturn === null ? 'text-[#6b7280]' : pctReturn >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <StatCard
          label="Equity %"
          value={equityPct !== null ? `${equityPct.toFixed(1)}%` : '—'}
          valueClass={equityPct === null ? 'text-[#6b7280]' : 'text-amber-400'}
        />
      </div>

      <WealthTable
        data={data}
        onDeleteHolding={handleDeleteHolding}
        onEditHolding={handleEditHolding}
      />
    </div>
  )
}

export default function WealthPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-[#6b7280] text-[13px]">Loading…</div>}>
      <WealthInner />
    </Suspense>
  )
}
