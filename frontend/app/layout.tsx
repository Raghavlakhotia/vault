import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vault',
  description: 'Household budget manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0f1117] min-h-screen`}>
        <Suspense>
          <Nav />
        </Suspense>
        <Suspense>
          {children}
        </Suspense>
      </body>
    </html>
  )
}
