'use client'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { currentMonth, prevMonth, nextMonth, formatMonthLabel } from '@/lib/utils'

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/budgets', label: 'Budgets' },
  { href: '/categories', label: 'Categories' },
]

export default function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const month = searchParams.get('month') ?? currentMonth()

  function navigate(newMonth: string) {
    router.push(`${pathname}?month=${newMonth}`)
  }

  return (
    <nav className="bg-[#13161f] border-b border-white/[0.07] px-6 flex items-center h-[52px]">
      <span className="text-indigo-400 font-bold text-[15px] tracking-wide mr-8">VAULT</span>
      <div className="flex gap-0.5 flex-1">
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={`${href}?month=${month}`}
            className={`px-3.5 py-1.5 rounded-md text-[13px] transition-colors ${
              pathname === href
                ? 'text-[#e4e6f0] bg-indigo-500/15'
                : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.04]'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(prevMonth(month))}
          className="w-[26px] h-[26px] rounded-md bg-white/[0.06] border border-white/[0.08] text-[#9ca3af] text-sm flex items-center justify-center hover:bg-white/10"
        >
          ‹
        </button>
        <span className="text-[#e4e6f0] font-medium text-[13px] min-w-[80px] text-center">
          {formatMonthLabel(month)}
        </span>
        <button
          onClick={() => navigate(nextMonth(month))}
          className="w-[26px] h-[26px] rounded-md bg-white/[0.06] border border-white/[0.08] text-[#9ca3af] text-sm flex items-center justify-center hover:bg-white/10"
        >
          ›
        </button>
      </div>
    </nav>
  )
}
