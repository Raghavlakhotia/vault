'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Wealth', href: '/wealth' },
  { label: 'Budget', href: '/budget' },
  { label: 'Library', href: '/library' },
  { label: 'Retirement', href: '/retirement' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav aria-label="Main" className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold tracking-wide">vault</Link>
      <ul className="flex items-center gap-6">
        {navItems.map(({ label, href }) => {
          const isActive = pathname === href
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'text-white font-semibold border-b-2 border-white pb-0.5'
                    : 'text-gray-400 hover:text-gray-200 transition-colors'
                }
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
