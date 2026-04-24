'use client'
import { useState, useMemo } from 'react'
import { WealthDashboardResponse, WealthRow } from '@/lib/api'
import { formatINR } from '@/lib/utils'

interface Props {
  data: WealthDashboardResponse
  onDeleteHolding: (id: number) => Promise<void>
  onEditHolding: (id: number, invested: number, market: number, useExp: boolean) => Promise<void>
}

type SortKey = 'asset_name' | 'expected_return' | 'invested_value' | 'market_value' | 'returns'
type SortDir = 'asc' | 'desc'
type CategoryFilter = 'All' | 'Equity' | 'Debt'
type HoldingFilter = 'All' | 'Has Holding' | 'No Holding'

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

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`inline ml-1 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}>
      {dir === 'asc' || !active
        ? <path d="M5 2L8.5 7H1.5L5 2Z" fill="currentColor" opacity={active && dir === 'asc' ? 1 : 0.4} />
        : null}
      {dir === 'desc' || !active
        ? <path d="M5 8L1.5 3H8.5L5 8Z" fill="currentColor" opacity={active && dir === 'desc' ? 1 : 0.4} />
        : null}
    </svg>
  )
}

function ToggleGroup<T extends string>({ options, value, onChange }: {
  options: T[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex bg-[#0f1117] rounded-lg border border-white/[0.07] p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1 rounded-md text-[12px] transition-colors ${
            value === opt
              ? 'bg-white/[0.08] text-[#e4e6f0]'
              : 'text-[#6b7280] hover:text-[#9ca3af]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function ReturnCell({ row }: { row: WealthRow }) {
  if (row.returns === null) return <span className="text-[#6b7280]">—</span>
  return (
    <span className={`inline-flex items-center gap-1 ${returnColor(row.returns, row.expected_return)}`}>
      {row.returns.toFixed(1)}%
      {row.use_expected_return && (
        <span className="text-[10px] text-[#6b7280]" title="Using asset's expected return">~</span>
      )}
    </span>
  )
}

function DataRow({ row, onDelete, onEdit }: {
  row: WealthRow
  onDelete: (id: number) => Promise<void>
  onEdit: (id: number, inv: number, mkt: number, useExp: boolean) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [invested, setInvested] = useState(row.invested_value.toString())
  const [market, setMarket] = useState(row.market_value.toString())
  const [useExp, setUseExp] = useState(row.use_expected_return)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    setSaving(true)
    const inv = parseFloat(invested) || 0
    await onEdit(row.holding_id!, inv, useExp ? inv : (parseFloat(market) || 0), useExp)
    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setEditing(false)
    setInvested(row.invested_value.toString())
    setMarket(row.market_value.toString())
    setUseExp(row.use_expected_return)
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
          <div className="flex flex-col items-end gap-1.5">
            <input
              type="number"
              value={invested}
              onChange={(e) => setInvested(e.target.value)}
              className="w-28 bg-[#0f1117] border border-white/[0.12] rounded px-2 py-1 text-[13px] text-[#e4e6f0] text-right focus:outline-none focus:border-emerald-500/50"
            />
            <label className="flex items-center gap-1.5 text-[11px] text-[#6b7280] cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={useExp} onChange={(e) => setUseExp(e.target.checked)} className="accent-emerald-500" />
              Use expected return
            </label>
          </div>
        ) : (
          <span className={row.holding_id ? 'text-[#e4e6f0]' : 'text-[#6b7280]'}>
            {row.holding_id ? formatINR(row.invested_value) : '—'}
          </span>
        )}
      </td>
      <td className={`${tdBase} text-right`}>
        {editing ? (
          useExp
            ? <span className="text-[#6b7280] text-[12px]">= Invested</span>
            : <input type="number" value={market} onChange={(e) => setMarket(e.target.value)} className="w-28 bg-[#0f1117] border border-white/[0.12] rounded px-2 py-1 text-[13px] text-[#e4e6f0] text-right focus:outline-none focus:border-emerald-500/50" />
        ) : (
          <span className={row.holding_id ? 'text-[#e4e6f0]' : 'text-[#6b7280]'}>
            {row.holding_id ? formatINR(row.market_value) : '—'}
          </span>
        )}
      </td>
      <td className={`${tdBase} text-right`}><ReturnCell row={row} /></td>
      <td className={`${tdBase} text-right`}>
        {editing ? (
          <div className="flex gap-2 justify-end">
            <button onClick={handleSave} disabled={saving} className="px-2.5 py-1 rounded text-[12px] bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50">
              {saving ? '…' : 'Save'}
            </button>
            <button onClick={handleCancel} className="px-2.5 py-1 rounded text-[12px] bg-white/[0.06] text-[#9ca3af] hover:bg-white/10 transition-colors">
              Cancel
            </button>
          </div>
        ) : row.holding_id ? (
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(true)} aria-label="Edit holding" className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/[0.06] text-[#6b7280] hover:text-[#9ca3af] transition-colors">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.5 2.5a1.5 1.5 0 0 1 2.12 2.12L5 13.24l-3 .76.76-3L11.5 2.5z" />
              </svg>
            </button>
            <button onClick={handleDelete} disabled={deleting} aria-label="Delete holding" className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/10 text-[#6b7280] hover:text-red-400 transition-colors disabled:opacity-40">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2 4 14 4" /><path d="M5 4V2h6v2" /><path d="M3 4l1 10h8l1-10" />
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

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All')
  const [holdingFilter, setHoldingFilter] = useState<HoldingFilter>('All')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'asset_name' ? 'asc' : 'desc')
    }
  }

  const filteredRows = useMemo(() => {
    let result = [...rows]

    if (categoryFilter !== 'All') result = result.filter((r) => r.category === categoryFilter)
    if (holdingFilter === 'Has Holding') result = result.filter((r) => r.holding_id !== null)
    if (holdingFilter === 'No Holding') result = result.filter((r) => r.holding_id === null)

    if (sortKey) {
      result.sort((a, b) => {
        let av: number | string, bv: number | string
        if (sortKey === 'asset_name') {
          av = a.asset_name.toLowerCase(); bv = b.asset_name.toLowerCase()
          return sortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (bv < av ? -1 : bv > av ? 1 : 0)
        }
        av = sortKey === 'returns' ? (a.returns ?? -Infinity) : a[sortKey]
        bv = sortKey === 'returns' ? (b.returns ?? -Infinity) : b[sortKey]
        return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
      })
    }

    return result
  }, [rows, categoryFilter, holdingFilter, sortKey, sortDir])

  // Recompute totals from filtered rows
  const filteredTotals = useMemo(() => {
    const totalInv = filteredRows.reduce((s, r) => s + r.invested_value, 0)
    const totalMkt = filteredRows.reduce((s, r) => s + r.market_value, 0)
    const wExp = totalInv > 0
      ? filteredRows.reduce((s, r) => s + r.expected_return * r.invested_value, 0) / totalInv
      : null
    const rowsWithRet = filteredRows.filter((r) => r.returns !== null && r.invested_value > 0)
    const wReal = totalInv > 0 && rowsWithRet.length > 0
      ? rowsWithRet.reduce((s, r) => s + r.returns! * r.invested_value, 0) / totalInv
      : null
    return { totalInv, totalMkt, wExp, wReal }
  }, [filteredRows])

  const thBase = 'px-4 py-2.5 text-[11px] font-medium text-[#6b7280] uppercase tracking-wide text-right select-none'
  const thSortable = `${thBase} cursor-pointer hover:text-[#9ca3af] transition-colors`

  function ThSort({ label, colKey, className }: { label: string; colKey: SortKey; className?: string }) {
    return (
      <th className={`${thSortable} ${className ?? ''}`} onClick={() => handleSort(colKey)}>
        {label}
        <SortIcon active={sortKey === colKey} dir={sortKey === colKey ? sortDir : 'desc'} />
      </th>
    )
  }

  const isFiltered = categoryFilter !== 'All' || holdingFilter !== 'All'

  return (
    <div className="space-y-3">
      {/* Filter / sort controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#6b7280] uppercase tracking-wide">Category</span>
          <ToggleGroup options={['All', 'Equity', 'Debt'] as CategoryFilter[]} value={categoryFilter} onChange={setCategoryFilter} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#6b7280] uppercase tracking-wide">Holdings</span>
          <ToggleGroup options={['All', 'Has Holding', 'No Holding'] as HoldingFilter[]} value={holdingFilter} onChange={setHoldingFilter} />
        </div>
        {isFiltered && (
          <button
            onClick={() => { setCategoryFilter('All'); setHoldingFilter('All') }}
            className="text-[12px] text-[#6b7280] hover:text-[#9ca3af] transition-colors"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-[11px] text-[#6b7280]">
          {filteredRows.length} of {rows.length} assets
        </span>
      </div>

      <div className="rounded-xl border border-white/[0.07] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#13161f]">
            <tr>
              <th className={`${thSortable} text-left`} onClick={() => handleSort('asset_name')}>
                Asset <SortIcon active={sortKey === 'asset_name'} dir={sortKey === 'asset_name' ? sortDir : 'asc'} />
              </th>
              <th className={thBase}>Category</th>
              <ThSort label="Exp. Return" colKey="expected_return" />
              <ThSort label="Invested" colKey="invested_value" />
              <ThSort label="Market Value" colKey="market_value" />
              <ThSort label="Return" colKey="returns" />
              <th className={thBase}></th>
            </tr>
          </thead>
          <tbody className="bg-[#1a1d27] divide-y divide-white/[0.04]">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-[#6b7280]">
                  {rows.length === 0 ? 'No assets yet. Add one via Wealth → Add Asset.' : 'No assets match the current filters.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <DataRow key={row.asset_id} row={row} onDelete={onDeleteHolding} onEdit={onEditHolding} />
              ))
            )}
          </tbody>
          {filteredRows.length > 0 && (
            <tfoot>
              <tr className="bg-emerald-500/5 border-t border-emerald-500/20">
                <td className="px-4 py-3 text-[13px] font-semibold text-emerald-300">
                  Total{isFiltered ? ' (filtered)' : ''}
                </td>
                <td />
                <td className="px-4 py-3 text-[13px] text-right text-[#9ca3af]">
                  {filteredTotals.wExp !== null ? `${filteredTotals.wExp.toFixed(1)}%` : '—'}
                </td>
                <td className="px-4 py-3 text-[13px] text-right text-[#e4e6f0] font-medium">
                  {formatINR(filteredTotals.totalInv)}
                </td>
                <td className="px-4 py-3 text-[13px] text-right text-[#e4e6f0] font-medium">
                  {formatINR(filteredTotals.totalMkt)}
                </td>
                <td className="px-4 py-3 text-[13px] text-right">
                  {filteredTotals.wReal !== null ? (
                    <span className={returnColor(filteredTotals.wReal, filteredTotals.wExp ?? 0)}>
                      {filteredTotals.wReal.toFixed(1)}%
                    </span>
                  ) : '—'}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
