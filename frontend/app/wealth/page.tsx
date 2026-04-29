'use client'

import { useState, useEffect } from 'react'
import { useVaultAuth, LoginForm } from '@/app/lib/auth'
import { formatINR, prevMonth, nextMonth } from '@/app/lib/utils'

const API = process.env.NEXT_PUBLIC_API_URL

interface WealthRow {
  asset_id: number
  asset_name: string
  category: string
  expected_return: number
  holding_id: number | null
  invested_value: number
  market_value: number
  returns: number | null
  use_expected_return: boolean
}

interface WealthTotals {
  weighted_expected_return: number | null
  total_invested: number
  total_market: number
  weighted_realized_return: number | null
}

interface WealthResponse {
  month_year: string
  rows: WealthRow[]
  totals: WealthTotals
}

interface Ratios {
  sharpe: number | null
  sortino: number | null
  months: number
}

export default function WealthPage() {
  const { token, login } = useVaultAuth()
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [data, setData] = useState<WealthResponse | null>(null)
  const [ratios, setRatios] = useState<Ratios | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    Promise.all([
      fetch(`${API}/api/wealth/${month}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/api/wealth/ratios`, { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(async ([wRes, rRes]) => {
      if (wRes.ok) setData(await wRes.json())
      if (rRes.ok) setRatios(await rRes.json())
    }).finally(() => setLoading(false))
  }, [token, month])

  if (!token) return <LoginForm login={login} />

  const gain = data ? data.totals.total_market - data.totals.total_invested : 0
  const gainPct = data && data.totals.total_invested > 0
    ? (gain / data.totals.total_invested) * 100
    : 0

  return (
    <div className="flex flex-col flex-1 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Wealth</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMonth(m => prevMonth(m))}
              className="text-gray-500 hover:text-gray-800 px-2 py-1 rounded text-lg"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-gray-700 w-20 text-center">{month}</span>
            <button
              onClick={() => setMonth(m => nextMonth(m))}
              className="text-gray-500 hover:text-gray-800 px-2 py-1 rounded text-lg"
            >
              ›
            </button>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-400 mb-4">Loading…</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card label="Invested" value={formatINR(data.totals.total_invested)} />
              <Card label="Market Value" value={formatINR(data.totals.total_market)} />
              <Card
                label="Unrealized Gain"
                value={`${formatINR(gain)} (${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(1)}%)`}
                color={gain >= 0 ? 'green' : 'red'}
              />
              {data.totals.weighted_expected_return !== null && (
                <Card label="Exp. Return" value={`${data.totals.weighted_expected_return}%`} />
              )}
            </div>

            {ratios && (ratios.sharpe !== null || ratios.sortino !== null) && (
              <div className="flex gap-3 mb-6 flex-wrap">
                {ratios.sharpe !== null && (
                  <div className="bg-white rounded-lg shadow px-4 py-3 text-sm">
                    <span className="text-gray-500">Sharpe </span>
                    <span className="font-semibold text-gray-900">{ratios.sharpe}</span>
                  </div>
                )}
                {ratios.sortino !== null && (
                  <div className="bg-white rounded-lg shadow px-4 py-3 text-sm">
                    <span className="text-gray-500">Sortino </span>
                    <span className="font-semibold text-gray-900">{ratios.sortino}</span>
                  </div>
                )}
                <div className="bg-white rounded-lg shadow px-4 py-3 text-sm text-gray-400">
                  {ratios.months} months of data
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-500">Asset</th>
                    <th className="px-4 py-3 font-semibold text-gray-500">Category</th>
                    <th className="px-4 py-3 font-semibold text-gray-500 text-right">Invested</th>
                    <th className="px-4 py-3 font-semibold text-gray-500 text-right">Market</th>
                    <th className="px-4 py-3 font-semibold text-gray-500 text-right">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map(row => (
                    <tr key={row.asset_id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.asset_name}</td>
                      <td className="px-4 py-3 text-gray-500">{row.category}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatINR(row.invested_value)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatINR(row.market_value)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        row.returns === null ? 'text-gray-400'
                        : row.returns >= 0 ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {row.returns === null
                          ? '—'
                          : `${row.returns > 0 ? '+' : ''}${row.returns}%`}
                        {row.use_expected_return && (
                          <span className="text-gray-400 text-xs ml-1">*</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold border-t border-gray-200">
                    <td className="px-4 py-3 text-gray-900" colSpan={2}>Total</td>
                    <td className="px-4 py-3 text-right text-gray-900">{formatINR(data.totals.total_invested)}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{formatINR(data.totals.total_market)}</td>
                    <td className={`px-4 py-3 text-right ${gainPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {gainPct > 0 ? '+' : ''}{gainPct.toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
              {data.rows.some(r => r.use_expected_return) && (
                <p className="px-4 py-2 text-xs text-gray-400">* using expected return instead of market value</p>
              )}
              {data.rows.length === 0 && (
                <p className="px-4 py-8 text-center text-gray-400 text-sm">No holdings recorded for {month}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Card({ label, value, color }: { label: string; value: string; color?: 'green' | 'red' }) {
  return (
    <div className="bg-white rounded-lg shadow px-4 py-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${
        color === 'green' ? 'text-green-600'
        : color === 'red' ? 'text-red-500'
        : 'text-gray-900'
      }`}>{value}</p>
    </div>
  )
}
