'use client'
import { useState } from 'react'
import { WealthDashboardResponse, WealthRow } from '@/lib/api'
import { formatINR } from '@/lib/utils'

interface Props {
  data: WealthDashboardResponse
  onDeleteHolding: (id: number) => Promise<void>
  onEditHolding: (id: number, invested: number, market: number) => Promise<void>
}

function returnColor(ret: number, expected: number) {
  if (ret < 0) return 'text-red-400'
  if (ret >= expected) return 'text-green-400'
  return 'text-amber-400'
}

function categoryBadge(cat: string) {
  return cat === 'Equity'
    ? 'bg-indigo-500/10 text-indigo-400'
    : 'bg-amber-500/10 text-amber-400'
}

function ReturnCell({ row }: { row: WealthRow }) {
  if (row.returns === null) return <span className="text-[#6b7280]">—</span>
  return (
    <span className={returnColor(row.returns, row.expected_return)}>
      {row.returns.toFixed(1)}%
    </span>
  )
}

function DataRow({ row, onDelete, onEdit }: {
  row: WealthRow
  onDelete: (id: number) => Promise<void>
  onEdit: (id: number, inv: number, mkt: number) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [invested, setInvested] = useState(row.invested_value.toString())
  const [market, setMarket] = useState(row.market_value.toString())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onEdit(row.holding_id!, parseFloat(invested) || 0, parseFloat(market) || 0)
    setSaving(false)
    setEditing(false)
  }

  async function handleDelete() {
    setDeleting(true)
    await onDelete(row.holding_id!)
  }

  const tdBase = 'px-4 py-3 text-[13px]'

  return (
    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
      <td className={`${tdBase} text-[#e4e6f0]`}>{row.asset_name}</td>
      <td className={tdBase}>
        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${categoryBadge(row.category)}`}>
          {row.category}
        </span>
      </td>
      <td className={`${tdBase} text-right text-[#9ca3af]`}>{row.expected_return}%</td>
      <td className={`${tdBase} text-right`}>
        {editing ? (
          <input
            type="number"
            value={invested}
            onChange={(e) => setInvested(e.target.value)}
            className="w-28 bg-[#0f1117] border border-white/[0.12] rounded px-2 py-1 text-[13px] text-[#e4e6f0] text-right focus:outline-none focus:border-emerald-500/50"
          />
        ) : (
          <span className={row.holding_id ? 'text-[#e4e6f0]' : 'text-[#6b7280]'}>
            {row.holding_id ? formatINR(row.invested_value) : '—'}
          </span>
        )}
      </td>
      <td className={`${tdBase} text-right`}>
        {editing ? (
          <input
            type="number"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="w-28 bg-[#0f1117] border border-white/[0.12] rounded px-2 py-1 text-[13px] text-[#e4e6f0] text-right focus:outline-none focus:border-emerald-500/50"
          />
        ) : (
          <span className={row.holding_id ? 'text-[#e4e6f0]' : 'text-[#6b7280]'}>
            {row.holding_id ? formatINR(row.market_value) : '—'}
          </span>
        )}
      </td>
      <td className={`${tdBase} text-right`}>
        <ReturnCell row={row} />
      </td>
      <td className={`${tdBase} text-right`}>
        {editing ? (
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-2.5 py-1 rounded text-[12px] bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
            >
              {saving ? '…' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setInvested(row.invested_value.toString()); setMarket(row.market_value.toString()) }}
              className="px-2.5 py-1 rounded text-[12px] bg-white/[0.06] text-[#9ca3af] hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : row.holding_id ? (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(true)}
              aria-label="Edit holding"
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/[0.06] text-[#6b7280] hover:text-[#9ca3af] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.5 2.5a1.5 1.5 0 0 1 2.12 2.12L5 13.24l-3 .76.76-3L11.5 2.5z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete holding"
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-[#6b7280] hover:text-red-400 transition-colors disabled:opacity-40"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2 4 14 4" /><path d="M5 4V2h6v2" />
                <path d="M3 4l1 10h8l1-10" />
              </svg>
            </button>
          </div>
        ) : null}
      </td>
    </tr>
  )
}

export default function WealthTable({ data, onDeleteHolding, onEditHolding }: Props) {
  const { rows, totals } = data
  const thBase = 'px-4 py-2.5 text-[11px] font-medium text-[#6b7280] uppercase tracking-wide text-right'

  return (
    <div className="rounded-xl border border-white/[0.07] overflow-hidden">
      <table className="w-full">
        <thead className="bg-[#13161f]">
          <tr>
            <th className={`${thBase} text-left`}>Asset</th>
            <th className={thBase}>Category</th>
            <th className={thBase}>Expected Return</th>
            <th className={thBase}>Invested</th>
            <th className={thBase}>Market Value</th>
            <th className={thBase}>Return</th>
            <th className={thBase}></th>
          </tr>
        </thead>
        <tbody className="bg-[#1a1d27] divide-y divide-white/[0.04]">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-[#6b7280]">
                No assets yet. Add one via Wealth → Add Asset.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <DataRow
                key={row.asset_id}
                row={row}
                onDelete={onDeleteHolding}
                onEdit={onEditHolding}
              />
            ))
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr className="bg-emerald-500/5 border-t border-emerald-500/20">
              <td className="px-4 py-3 text-[13px] font-semibold text-emerald-300">Total</td>
              <td />
              <td className="px-4 py-3 text-[13px] text-right text-[#9ca3af]">
                {totals.weighted_expected_return !== null ? `${totals.weighted_expected_return}%` : '—'}
              </td>
              <td className="px-4 py-3 text-[13px] text-right text-[#e4e6f0] font-medium">
                {formatINR(totals.total_invested)}
              </td>
              <td className="px-4 py-3 text-[13px] text-right text-[#e4e6f0] font-medium">
                {formatINR(totals.total_market)}
              </td>
              <td className="px-4 py-3 text-[13px] text-right">
                {totals.weighted_realized_return !== null ? (
                  <span className={returnColor(totals.weighted_realized_return, totals.weighted_expected_return ?? 0)}>
                    {totals.weighted_realized_return.toFixed(1)}%
                  </span>
                ) : '—'}
              </td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
