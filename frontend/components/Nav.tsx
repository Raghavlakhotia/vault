'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { currentMonth, prevMonth, nextMonth, formatMonthLabel } from '@/lib/utils'
import { clearToken } from '@/lib/auth'
import AddExpenseDrawer from '@/components/AddExpenseDrawer'

const BUDGET_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/overview', label: 'Overview' },
  { href: '/budgets/default', label: 'Default Budget' },
  { href: '/budgets', label: 'Budget Allocation' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/categories', label: 'Add Category' },
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
  const [drawerOpen, setDrawerOpen] = useState(false)

  const budget = useDropdown()
  const wealth = useDropdown()

  function navigate(newMonth: string) {
    router.replace(`${pathname}?month=${newMonth}`)
  }

  function signOut() {
    clearToken()
    router.replace('/login')
  }

  if (pathname === '/login') return null

  const isWealthSection = pathname.startsWith('/wealth')
  const isLibrarySection = pathname.startsWith('/library')
  const isBudgetSection = !isWealthSection && !isLibrarySection
  const budgetActiveLabel = BUDGET_LINKS.find((l) => l.href === pathname)?.label ?? 'Budget'
  const wealthActiveLabel = WEALTH_LINKS.find((l) => l.href === pathname)?.label ?? 'Wealth'
  const hideMonthSwitcher = pathname === '/categories' || pathname === '/overview' || pathname === '/budgets/default'

  const currentPageLabel = isWealthSection ? wealthActiveLabel : isLibrarySection ? 'Library' : budgetActiveLabel

  const MonthSwitcher = ({ compact }: { compact?: boolean }) => (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      <button
        aria-label="Previous month"
        onClick={() => navigate(prevMonth(month))}
        className={`${compact ? 'w-[24px] h-[24px]' : 'w-[26px] h-[26px]'} rounded-md bg-white/[0.06] border border-white/[0.08] text-[#9ca3af] text-sm flex items-center justify-center hover:bg-white/10`}
      >
        ‹
      </button>
      <span className={`text-[#e4e6f0] font-medium ${compact ? 'text-[12px] min-w-[70px]' : 'text-[13px] min-w-[80px]'} text-center`}>
        {formatMonthLabel(month)}
      </span>
      <button
        aria-label="Next month"
        onClick={() => navigate(nextMonth(month))}
        className={`${compact ? 'w-[24px] h-[24px]' : 'w-[26px] h-[26px]'} rounded-md bg-white/[0.06] border border-white/[0.08] text-[#9ca3af] text-sm flex items-center justify-center hover:bg-white/10`}
      >
        ›
      </button>
    </div>
  )

  return (
    <>
      {/* ── Desktop nav ───────────────────────────────────────────── */}
      <nav className="hidden md:flex bg-[#13161f] border-b border-white/[0.07] px-6 items-center h-[52px]">
        <span className="text-indigo-400 font-bold text-[15px] tracking-wide mr-8">VAULT</span>

        <div className="flex gap-2 flex-1">
          {/* Budget dropdown */}
          <div className="relative" ref={budget.ref}>
            <button
              onClick={() => { budget.setOpen((o) => !o); wealth.setOpen(false) }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] transition-colors ${
                isBudgetSection
                  ? 'text-[#e4e6f0] bg-indigo-500/15 hover:bg-indigo-500/25'
                  : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.04]'
              }`}
            >
              {budgetActiveLabel}
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-150 ${budget.open ? 'rotate-180' : ''} ${isBudgetSection ? 'text-indigo-400' : 'text-[#6b7280]'}`}
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

          {/* Library link */}
          <Link
            href="/library"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] transition-colors ${
              isLibrarySection
                ? 'text-violet-300 bg-violet-500/15 hover:bg-violet-500/25'
                : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.04]'
            }`}
          >
            Library
          </Link>
        </div>

        {!hideMonthSwitcher && <MonthSwitcher />}

        <button
          onClick={signOut}
          aria-label="Sign out"
          title="Sign out"
          className="ml-3 text-[#4b5563] hover:text-[#9ca3af] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </nav>

      {/* ── Mobile top bar ────────────────────────────────────────── */}
      <nav className="flex md:hidden bg-[#13161f] border-b border-white/[0.07] px-4 items-center h-[52px] gap-3">
        <span className="text-indigo-400 font-bold text-[15px] tracking-wide shrink-0">VAULT</span>
        <span className="flex-1 text-center text-[#e4e6f0] font-medium text-[13px] truncate">{currentPageLabel}</span>
        {!hideMonthSwitcher ? (
          <MonthSwitcher compact />
        ) : (
          <div className="w-[24px] shrink-0" />
        )}
        <button
          onClick={signOut}
          aria-label="Sign out"
          className="text-[#4b5563] hover:text-[#9ca3af] transition-colors shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </nav>

      {/* ── Mobile bottom nav bar ─────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-[#13161f] border-t border-white/[0.07]">
        <div className="flex items-end justify-around px-2 pt-2 pb-4">

          {/* Budget */}
          <Link
            href={`/?month=${month}`}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl ${
              isBudgetSection ? 'text-indigo-400' : 'text-[#4b5563]'
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="text-[10px] font-medium">Budget</span>
          </Link>

          {/* Wealth */}
          <Link
            href={`/wealth?month=${month}`}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl ${
              isWealthSection ? 'text-emerald-400' : 'text-[#4b5563]'
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className="text-[10px] font-medium">Wealth</span>
          </Link>

          {/* + FAB */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Add Expense"
            className="flex flex-col items-center gap-1 -translate-y-4"
          >
            <div className="w-[54px] h-[54px] rounded-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 flex items-center justify-center shadow-xl shadow-indigo-900/60 transition-colors">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <span className="text-[10px] font-medium text-[#6b7280]">Add</span>
          </button>

          {/* Library */}
          <Link
            href="/library"
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl ${
              isLibrarySection ? 'text-violet-400' : 'text-[#4b5563]'
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="text-[10px] font-medium">Library</span>
          </Link>

        </div>
      </div>

      {/* Add Expense Drawer — used by FAB on mobile */}
      <AddExpenseDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}
