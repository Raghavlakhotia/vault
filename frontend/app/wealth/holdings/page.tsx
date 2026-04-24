'use client'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api, AssetOut } from '@/lib/api'
import { currentMonth } from '@/lib/utils'

function AddHoldingInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const month = searchParams.get('month') ?? currentMonth()

  const [assets, setAssets] = useState<AssetOut[]>([])
  const [assetId, setAssetId] = useState<number | ''>('')
  const [monthYear, setMonthYear] = useState(month)
  const [invested, setInvested] = useState('')
  const [market, setMarket] = useState('')
  const [useExp, setUseExp] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchAssets = useCallback(async () => {
    try {
      setAssets(await api.getAssets())
    } catch {
      setError('Failed to load assets')
    }
  }, [])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (assetId === '') return
    setSaving(true)
    setError('')
    try {
      const inv = parseFloat(invested) || 0
      await api.createHolding({
        asset_id: assetId,
        month_year: monthYear,
        invested_value: inv,
        market_value: useExp ? inv : (parseFloat(market) || 0),
        use_expected_return: useExp,
      })
      router.push(`/wealth?month=${monthYear}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add holding'
      setError(msg.includes('409') || msg.includes('already exists')
        ? 'A holding for this asset and month already exists. Edit it from the dashboard.'
        : msg)
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-[#0f1117] border border-white/[0.12] rounded-lg px-3 py-2.5 text-[13px] text-[#e4e6f0] focus:outline-none focus:border-emerald-500/50 placeholder:text-[#4b5563]'
  const labelCls = 'block text-[12px] font-medium text-[#9ca3af] mb-1.5'

  return (
    <div className="px-8 py-6 max-w-md mx-auto">
      <h1 className="text-[#e4e6f0] text-[17px] font-semibold mb-6">Add Holding</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-[#1a1d27] rounded-xl border border-white/[0.07] p-6">
        <div>
          <label className={labelCls}>Asset</label>
          <select
            required
            value={assetId}
            onChange={(e) => setAssetId(e.target.value ? Number(e.target.value) : '')}
            className={inputCls}
          >
            <option value="">Select an asset…</option>
            {assets.map((a) => (
              <option key={a.asset_id} value={a.asset_id}>
                {a.asset_name} ({a.category})
              </option>
            ))}
          </select>
          {assets.length === 0 && (
            <p className="mt-1 text-[11px] text-[#6b7280]">
              No assets yet.{' '}
              <Link href={`/wealth/assets?month=${month}`} className="text-emerald-400 hover:underline">
                Add one first.
              </Link>
            </p>
          )}
        </div>
        <div>
          <label className={labelCls}>Month</label>
          <input
            type="text"
            required
            pattern="\d{4}-\d{2}"
            placeholder="YYYY-MM"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Invested Value (₹)</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="e.g. 50000"
            value={invested}
            onChange={(e) => setInvested(e.target.value)}
            className={inputCls}
          />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useExp}
            onChange={(e) => setUseExp(e.target.checked)}
            className="accent-emerald-500 w-4 h-4"
          />
          <span className="text-[13px] text-[#9ca3af]">
            Use expected return <span className="text-[#6b7280]">(e.g. EPF, PPF — market value unknown)</span>
          </span>
        </label>
        {!useExp && (
          <div>
            <label className={labelCls}>Market Value (₹)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="e.g. 52000"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className={inputCls}
            />
          </div>
        )}
        {error && <p className="text-red-400 text-[12px]">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={saving || assetId === '' || !invested || (!useExp && !market)}
            className="flex-1 py-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-[13px] font-medium hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add Holding'}
          </button>
          <Link
            href={`/wealth?month=${month}`}
            className="flex-1 py-2.5 rounded-lg bg-white/[0.06] text-[#9ca3af] text-[13px] font-medium hover:bg-white/10 transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

export default function AddHoldingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-[#6b7280] text-[13px]">Loading…</div>}>
      <AddHoldingInner />
    </Suspense>
  )
}
