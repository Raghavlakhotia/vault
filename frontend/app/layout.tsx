import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'
import AuthGuard from '@/components/AuthGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vault',
  description: 'Household budget manager',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0f1117] min-h-screen pb-20 md:pb-0`}>
        <AuthGuard>
          <Suspense fallback={<div className="h-[52px] bg-[#13161f] border-b border-white/[0.07]" />}>
            <Nav />
          </Suspense>
          {children}
        </AuthGuard>
      </body>
    </html>
  )
}
