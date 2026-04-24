'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { currentMonth } from '@/lib/utils'

export default function AddAssetPage() {
  const router = useRouter()
  const [assetName, setAssetName] = useState('')
  const [category, setCategory] = useState<'Equity' | 'Debt'>('Equity')
  const [expectedReturn, setExpectedReturn] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.createAsset({
        asset_name: assetName.trim(),
        category,
        expected_return: parseFloat(expectedReturn) || 0,
      })
      router.push(`/wealth?month=${currentMonth()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset')
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-[#0f1117] border border-white/[0.12] rounded-lg px-3 py-2.5 text-[13px] text-[#e4e6f0] focus:outline-none focus:border-emerald-500/50 placeholder:text-[#4b5563]'
  const labelCls = 'block text-[12px] font-medium text-[#9ca3af] mb-1.5'

  return (
    <div className="px-8 py-6 max-w-md mx-auto">
      <h1 className="text-[#e4e6f0] text-[17px] font-semibold mb-6">Add Asset</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-[#1a1d27] rounded-xl border border-white/[0.07] p-6">
        <div>
          <label className={labelCls}>Asset Name</label>
          <input
            type="text"
            required
            placeholder="e.g. HDFC Nifty 50 ETF"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as 'Equity' | 'Debt')}
            className={inputCls}
          >
            <option value="Equity">Equity</option>
            <option value="Debt">Debt</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Expected Return (%)</label>
          <input
            type="number"
            required
            min="0"
            step="0.1"
            placeholder="e.g. 12"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(e.target.value)}
            className={inputCls}
          />
        </div>
        {error && <p className="text-red-400 text-[12px]">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={saving || !assetName.trim() || !expectedReturn}
            className="flex-1 py-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-[13px] font-medium hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add Asset'}
          </button>
          <Link
            href={`/wealth?month=${currentMonth()}`}
            className="flex-1 py-2.5 rounded-lg bg-white/[0.06] text-[#9ca3af] text-[13px] font-medium hover:bg-white/10 transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
