'use client'

import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL

export function useVaultAuth() {
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    const stored = localStorage.getItem('vault_token')
    if (stored) setToken(stored)
  }, [])

  async function login(username: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const t: string = data.access_token
      localStorage.setItem('vault_token', t)
      setToken(t)
      return t
    } catch {
      return null
    }
  }

  return { token, login }
}

export function LoginForm({ login }: { login: (u: string, p: string) => Promise<string | null> }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const t = await login(username, password)
    if (!t) setError('Invalid credentials. Please try again.')
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-gray-50 min-h-screen px-4">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign in to Vault</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white rounded-md py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
