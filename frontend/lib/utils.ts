export function formatINR(amount: number): string {
  return `₹${Math.abs(amount).toLocaleString('en-IN')}`
}

export function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export function prevMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 2)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function nextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-')
  return new Date(parseInt(year), parseInt(m) - 1).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  })
}

export function pctBadgeClass(pct: number): string {
  if (pct >= 100) return 'bg-red-500/10 text-red-400'
  if (pct >= 80) return 'bg-amber-500/10 text-amber-400'
  return 'bg-indigo-500/15 text-indigo-400'
}

export function limitColor(amount: number): string {
  if (amount < 0) return 'text-red-400'
  if (amount < 500) return 'text-amber-400'
  return 'text-green-400'
}
