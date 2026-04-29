'use client'

import { useState, useEffect } from 'react'
import { useVaultAuth, LoginForm } from '@/app/lib/auth'
import { formatINR, prevMonth, nextMonth } from '@/app/lib/utils'

const API = process.env.NEXT_PUBLIC_API_URL

interface Expense {
  id: number
  amount: number
  category: string
  description: string
  paid_by: string
  date: string
}

export default function BudgetPage() {
  const { token, login } = useVaultAuth()
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [defaultBudget, setDefaultBudget] = useState<Record<string, number>>({})
  const [monthBudget, setMonthBudget] = useState<Record<string, number>>({})
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    Promise.all([
      fetch(`${API}/api/budget/default`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/api/budget/${month}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/api/expenses?month=${month}`, { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(async ([defRes, mRes, expRes]) => {
      if (defRes.ok) setDefaultBudget((await defRes.json()).budgets ?? {})
      if (mRes.ok) setMonthBudget((await mRes.json()).budgets ?? {})
      if (expRes.ok) setExpenses(await expRes.json())
    }).finally(() => setLoading(false))
  }, [token, month])

  if (!token) return <LoginForm login={login} />

  // Month-specific overrides default
  const budget: Record<string, number> = { ...defaultBudget, ...monthBudget }

  const spent: Record<string, number> = {}
  for (const e of expenses) {
    spent[e.category] = (spent[e.category] ?? 0) + e.amount
  }

  const categories = Array.from(
    new Set([...Object.keys(budget), ...Object.keys(spent)])
  ).sort()

  const totalBudget = Object.values(budget).reduce((a, b) => a + b, 0)
  const totalSpent = expenses.reduce((a, e) => a + e.amount, 0)

  return (
    <div className="flex flex-col flex-1 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Budget</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMonth(m => prevMonth(m))}
              className="text-gray-500 hover:text-gray-800 px-2 py-1 rounded text-lg"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-gray-700 w-20 text-center">{month}</span>
            <button
              onClick={() => setMonth(m => nextMonth(m))}
              className="text-gray-500 hover:text-gray-800 px-2 py-1 rounded text-lg"
            >
              ›
            </button>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-400 mb-4">Loading…</p>}

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card label="Budget" value={totalBudget > 0 ? formatINR(totalBudget) : '—'} />
          <Card label="Spent" value={formatINR(totalSpent)} />
          <Card
            label="Remaining"
            value={totalBudget > 0 ? formatINR(totalBudget - totalSpent) : '—'}
            color={totalBudget > 0 ? (totalSpent > totalBudget ? 'red' : 'green') : undefined}
          />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 font-semibold text-gray-500">Category</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-right">Budget</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-right">Spent</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-right">Remaining</th>
                <th className="px-4 py-3 font-semibold text-gray-500 w-32">Usage</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => {
                const b = budget[cat] ?? 0
                const s = spent[cat] ?? 0
                const rem = b - s
                const pct = b > 0 ? Math.min((s / b) * 100, 100) : 0
                const over = b > 0 && s > b
                return (
                  <tr key={cat} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{cat}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{b > 0 ? formatINR(b) : '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{s > 0 ? formatINR(s) : '—'}</td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      b === 0 ? 'text-gray-400' : over ? 'text-red-500' : 'text-green-600'
                    }`}>
                      {b > 0 ? (over ? `-${formatINR(s - b)}` : formatINR(rem)) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {b > 0 && (
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${over ? 'bg-red-500' : 'bg-indigo-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!loading && categories.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-gray-400">
              No budget or expenses for {month}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Card({ label, value, color }: { label: string; value: string; color?: 'green' | 'red' }) {
  return (
    <div className="bg-white rounded-lg shadow px-4 py-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${
        color === 'green' ? 'text-green-600'
        : color === 'red' ? 'text-red-500'
        : 'text-gray-900'
      }`}>{value}</p>
    </div>
  )
}
