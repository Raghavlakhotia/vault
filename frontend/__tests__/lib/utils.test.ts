import {
  formatINR,
  formatDate,
  prevMonth,
  nextMonth,
  formatMonthLabel,
  pctBadgeClass,
  limitColor,
  currentMonth,
} from '@/lib/utils'

describe('formatINR', () => {
  it('formats a positive integer', () => { expect(formatINR(1000)).toBe('₹1,000') })
  it('formats a large amount', () => { expect(formatINR(24800)).toBe('₹24,800') })
  it('uses absolute value for negatives', () => { expect(formatINR(-700)).toBe('₹700') })
  it('formats zero', () => { expect(formatINR(0)).toBe('₹0') })
})

describe('formatDate', () => {
  it('formats YYYY-MM-DD to D Mon', () => { expect(formatDate('2026-04-22')).toBe('22 Apr') })
  it('formats January correctly', () => { expect(formatDate('2026-01-01')).toBe('1 Jan') })
  it('formats December correctly', () => { expect(formatDate('2026-12-31')).toBe('31 Dec') })
})

describe('prevMonth', () => {
  it('returns the previous month', () => { expect(prevMonth('2026-04')).toBe('2026-03') })
  it('wraps from January to December of prior year', () => { expect(prevMonth('2026-01')).toBe('2025-12') })
})

describe('nextMonth', () => {
  it('returns the next month', () => { expect(nextMonth('2026-04')).toBe('2026-05') })
  it('wraps from December to January of next year', () => { expect(nextMonth('2026-12')).toBe('2027-01') })
})

describe('pctBadgeClass', () => {
  it('returns indigo for pct < 80', () => {
    expect(pctBadgeClass(70)).toBe('bg-indigo-500/15 text-indigo-400')
  })
  it('returns amber for pct === 80', () => {
    expect(pctBadgeClass(80)).toBe('bg-amber-500/10 text-amber-400')
  })
  it('returns amber for pct 99', () => {
    expect(pctBadgeClass(99)).toBe('bg-amber-500/10 text-amber-400')
  })
  it('returns red for pct === 100', () => {
    expect(pctBadgeClass(100)).toBe('bg-red-500/10 text-red-400')
  })
  it('returns red for pct > 100', () => {
    expect(pctBadgeClass(115)).toBe('bg-red-500/10 text-red-400')
  })
})

describe('limitColor', () => {
  it('returns red for negative amount', () => { expect(limitColor(-1)).toBe('text-red-400') })
  it('returns amber for amount 0', () => { expect(limitColor(0)).toBe('text-amber-400') })
  it('returns amber for amount < 500', () => { expect(limitColor(499)).toBe('text-amber-400') })
  it('returns green for amount >= 500', () => { expect(limitColor(500)).toBe('text-green-400') })
})

describe('currentMonth', () => {
  it('returns a string matching YYYY-MM format', () => {
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/)
  })
  it('returns the correct month for a given date', () => {
    expect(currentMonth(new Date('2026-04-24T00:00:00Z'))).toBe('2026-04')
  })
})

describe('formatMonthLabel', () => {
  it('formats YYYY-MM as a human-readable month label', () => {
    expect(formatMonthLabel('2026-04')).toBe('Apr 2026')
  })
})
