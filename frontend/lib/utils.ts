// Returns magnitude only — callers prepend "−" for negative values
export function formatINR(amount: number): string {
  return `₹${Math.abs(amount).toLocaleString('en-IN')}`
}

export function formatDate(dateStr: string): string {
  const parts = dateStr?.split('-')
  if (!parts || parts.length < 3) return dateStr ?? ''
  const [, m, d] = parts
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`
}

export function currentMonth(now: Date = new Date()): string {
  return now.toISOString().slice(0, 7)
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
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m) - 1]} ${year}`
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

const PAID_BY_PALETTE = [
  'bg-indigo-500/15 text-indigo-300',
  'bg-pink-500/10 text-pink-400',
  'bg-emerald-500/15 text-emerald-300',
  'bg-amber-500/10 text-amber-400',
  'bg-sky-500/15 text-sky-300',
  'bg-violet-500/15 text-violet-300',
]

// Stable per-name palette pick: same name always gets the same color.
export function paidByBadgeClass(name: string): string {
  if (!name) return 'bg-white/[0.06] text-[#9ca3af]'
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return PAID_BY_PALETTE[Math.abs(hash) % PAID_BY_PALETTE.length]
}
