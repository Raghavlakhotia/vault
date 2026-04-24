'use client'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { api, WealthDashboardResponse } from '@/lib/api'
import { currentMonth } from '@/lib/utils'
import WealthTable from '@/components/WealthTable'

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

  return (
    <div className="px-8 py-6 max-w-6xl mx-auto">
      <h1 className="text-[#e4e6f0] text-[17px] font-semibold mb-5">
        Wealth Dashboard
        <span className="ml-3 text-[13px] font-normal text-[#6b7280]">{month}</span>
      </h1>
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
