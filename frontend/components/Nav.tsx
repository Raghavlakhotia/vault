'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { currentMonth, prevMonth, nextMonth, formatMonthLabel } from '@/lib/utils'

const BUDGET_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/categories', label: 'Categories' },
  { href: '/budgets', label: 'Budget Allocation' },
]

const WEALTH_LINKS = [
  { href: '/wealth', label: 'Dashboard' },
  { href: '/wealth/overview', label: 'Overview' },
  { href: '/wealth/assets', label: 'Add Asset' },
  { href: '/wealth/holdings', label: 'Add Holding' },
]

function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  return { open, setOpen, ref }
}

export default function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const month = searchParams.get('month') ?? currentMonth()

  const budget = useDropdown()
  const wealth = useDropdown()

  function navigate(newMonth: string) {
    router.replace(`${pathname}?month=${newMonth}`)
  }

  const isWealthSection = pathname.startsWith('/wealth')
  const budgetActiveLabel = BUDGET_LINKS.find((l) => l.href === pathname)?.label ?? 'Budget'
  const wealthActiveLabel = WEALTH_LINKS.find((l) => l.href === pathname)?.label ?? 'Wealth'

  return (
    <nav className="bg-[#13161f] border-b border-white/[0.07] px-6 flex items-center h-[52px]">
      <span className="text-indigo-400 font-bold text-[15px] tracking-wide mr-8">VAULT</span>

      <div className="flex gap-2 flex-1">
        {/* Budget dropdown */}
        <div className="relative" ref={budget.ref}>
          <button
            onClick={() => { budget.setOpen((o) => !o); wealth.setOpen(false) }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] transition-colors ${
              !isWealthSection
                ? 'text-[#e4e6f0] bg-indigo-500/15 hover:bg-indigo-500/25'
                : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.04]'
            }`}
          >
            {budgetActiveLabel}
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-150 ${budget.open ? 'rotate-180' : ''} ${!isWealthSection ? 'text-indigo-400' : 'text-[#6b7280]'}`}
              viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {budget.open && (
            <div className="absolute top-[calc(100%+6px)] left-0 w-48 rounded-lg border border-white/[0.07] bg-[#1a1d27] shadow-xl py-1 z-50">
              {BUDGET_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={`${href}?month=${month}`}
                  onClick={() => budget.setOpen(false)}
                  className={`flex items-center px-3.5 py-2 text-[13px] transition-colors ${
                    pathname === href
                      ? 'text-indigo-400 bg-indigo-500/10'
                      : 'text-[#9ca3af] hover:text-[#e4e6f0] hover:bg-white/[0.04]'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Wealth dropdown */}
        <div className="relative" ref={wealth.ref}>
          <button
            onClick={() => { wealth.setOpen((o) => !o); budget.setOpen(false) }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] transition-colors ${
              isWealthSection
                ? 'text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25'
                : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.04]'
            }`}
          >
            {wealthActiveLabel}
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-150 ${wealth.open ? 'rotate-180' : ''} ${isWealthSection ? 'text-emerald-400' : 'text-[#6b7280]'}`}
              viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {wealth.open && (
            <div className="absolute top-[calc(100%+6px)] left-0 w-44 rounded-lg border border-white/[0.07] bg-[#1a1d27] shadow-xl py-1 z-50">
              {WEALTH_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={`${href}?month=${month}`}
                  onClick={() => wealth.setOpen(false)}
                  className={`flex items-center px-3.5 py-2 text-[13px] transition-colors ${
                    pathname === href
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-[#9ca3af] hover:text-[#e4e6f0] hover:bg-white/[0.04]'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
        </div>
        {/* Library button — no dropdown */}
        <Link
          href="/library"
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] transition-colors ${
            pathname.startsWith('/library')
              ? 'text-violet-300 bg-violet-500/15 hover:bg-violet-500/25'
              : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.04]'
          }`}
        >
          Library
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="Previous month"
          onClick={() => navigate(prevMonth(month))}
          className="w-[26px] h-[26px] rounded-md bg-white/[0.06] border border-white/[0.08] text-[#9ca3af] text-sm flex items-center justify-center hover:bg-white/10"
        >
          ‹
        </button>
        <span className="text-[#e4e6f0] font-medium text-[13px] min-w-[80px] text-center">
          {formatMonthLabel(month)}
        </span>
        <button
          aria-label="Next month"
          onClick={() => navigate(nextMonth(month))}
          className="w-[26px] h-[26px] rounded-md bg-white/[0.06] border border-white/[0.08] text-[#9ca3af] text-sm flex items-center justify-center hover:bg-white/10"
        >
          ›
        </button>
      </div>
    </nav>
  )
}
