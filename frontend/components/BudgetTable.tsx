import { DashboardRow } from '@/lib/api'
import { formatINR, pctBadgeClass, limitColor } from '@/lib/utils'

interface Props {
  matrix: DashboardRow[]
  totals: DashboardRow
}

export default function BudgetTable({ matrix, totals }: Props) {
  const rows = [...matrix].sort((a, b) => a.category.localeCompare(b.category))

  function fmtLimit(amount: number) {
    return amount < 0 ? `−${formatINR(amount)}` : formatINR(amount)
  }

  const monthlyLeft = totals.monthly_budget - totals.spent

  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
    <div className="min-w-[700px]">
    <div className="bg-[#1a1d27] overflow-hidden">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-[#13161f] border-b border-white/[0.07]">
            {['Category', 'Monthly Budget', 'Cumulative', 'Total Expense', '% Expense', 'Monthly Limit Left', 'Free Limit'].map((h, i) => (
              <th
                key={h}
                className={`py-2.5 px-3.5 text-[11px] font-medium text-[#6b7280] uppercase tracking-wider whitespace-nowrap ${i === 0 ? 'text-left' : 'text-right'}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const mLeft = row.monthly_budget - row.spent
            return (
              <tr key={row.category} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-3.5 text-[#e4e6f0] font-medium">{row.category}</td>
                <td className="py-3 px-3.5 text-right text-[#c9ccd8]">{formatINR(row.monthly_budget)}</td>
                <td className="py-3 px-3.5 text-right text-[#c9ccd8]">{formatINR(row.cumulative)}</td>
                <td className="py-3 px-3.5 text-right text-[#c9ccd8]">{formatINR(row.spent)}</td>
                <td className="py-3 px-3.5 text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${pctBadgeClass(row.pct_used)}`}>
                    {row.pct_used.toFixed(0)}%
                  </span>
                </td>
                <td className={`py-3 px-3.5 text-right font-medium ${limitColor(mLeft)}`}>{fmtLimit(mLeft)}</td>
                <td className={`py-3 px-3.5 text-right font-medium ${limitColor(row.remaining)}`}>{fmtLimit(row.remaining)}</td>
              </tr>
            )
          })}
          <tr className="bg-indigo-500/[0.07] border-t border-indigo-500/20">
            <td className="py-3 px-3.5 text-indigo-400 font-semibold text-[11px] uppercase tracking-wider">Total</td>
            <td className="py-3 px-3.5 text-right text-[#e4e6f0] font-semibold">{formatINR(totals.monthly_budget)}</td>
            <td className="py-3 px-3.5 text-right text-[#e4e6f0] font-semibold">{formatINR(totals.cumulative)}</td>
            <td className="py-3 px-3.5 text-right text-[#e4e6f0] font-semibold">{formatINR(totals.spent)}</td>
            <td className="py-3 px-3.5 text-right">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${pctBadgeClass(totals.pct_used)}`}>
                {totals.pct_used.toFixed(0)}%
              </span>
            </td>
            <td className={`py-3 px-3.5 text-right font-semibold ${limitColor(monthlyLeft)}`}>{fmtLimit(monthlyLeft)}</td>
            <td className={`py-3 px-3.5 text-right font-semibold ${limitColor(totals.remaining)}`}>{fmtLimit(totals.remaining)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>
    </div>
  )
}
