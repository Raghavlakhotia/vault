'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { currentMonth, prevMonth, nextMonth, formatMonthLabel } from '@/lib/utils'

const DROPDOWN_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/categories', label: 'Categories' },
  { href: '/budgets', label: 'Budget Allocation' },
]

export default function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const month = searchParams.get('month') ?? currentMonth()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function navigate(newMonth: string) {
    router.replace(`${pathname}?month=${newMonth}`)
  }

  const activeLabel = DROPDOWN_LINKS.find((l) => l.href === pathname)?.label ?? 'Budget'

  return (
    <nav className="bg-[#13161f] border-b border-white/[0.07] px-6 flex items-center h-[52px]">
      <span className="text-indigo-400 font-bold text-[15px] tracking-wide mr-8">VAULT</span>

      <div className="flex-1 relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] text-[#e4e6f0] bg-indigo-500/15 hover:bg-indigo-500/25 transition-colors"
        >
          {activeLabel}
          <svg
            className={`w-3.5 h-3.5 text-indigo-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div className="absolute top-[calc(100%+6px)] left-0 w-48 rounded-lg border border-white/[0.07] bg-[#1a1d27] shadow-xl py-1 z-50">
            {DROPDOWN_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={`${href}?month=${month}`}
                onClick={() => setOpen(false)}
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
