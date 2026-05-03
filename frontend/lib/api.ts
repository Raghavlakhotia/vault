import { getToken, clearToken, setToken } from './auth'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export interface DashboardRow {
  category: string
  monthly_budget: number
  prev_unused: number
  cumulative: number
  spent: number
  remaining: number
  pct_used: number
}

export interface DashboardResponse {
  month: string
  matrix: DashboardRow[]
  totals: DashboardRow
  expenses: ExpenseOut[]
}

export interface ExpenseOut {
  id: number
  amount: number
  category: string
  description: string
  paid_by: string
  source: string
  date: string
}

export interface ExpenseCreate {
  amount: number
  category: string
  description?: string
  paid_by: string
  source?: string
  date?: string
}

export interface BudgetEntry {
  category: string
  amount: number
}

export interface BudgetResponse {
  month: string
  budgets: Record<string, number>
}

export interface AssetOut {
  asset_id: number
  asset_name: string
  category: 'Equity' | 'Debt'
  expected_return: number
}

export interface HoldingOut {
  id: number
  asset_id: number
  month_year: string
  invested_value: number
  market_value: number
  use_expected_return: boolean
}

export interface WealthRow {
  asset_id: number
  asset_name: string
  category: 'Equity' | 'Debt'
  expected_return: number
  holding_id: number | null
  invested_value: number
  market_value: number
  returns: number | null
  use_expected_return: boolean
}

export interface WealthTotals {
  weighted_expected_return: number | null
  total_invested: number
  total_market: number
  weighted_realized_return: number | null
}

export interface BookMeta {
  slug: string
  title: string
  author: string
  order: number
}

export type CategoryKind = 'Need' | 'Want'

export interface Category {
  name: string
  kind: CategoryKind
}

export interface IncomeSubAllocation {
  name: string
  amount: number
}

export interface IncomeAllocation {
  amount: number
  subs: IncomeSubAllocation[]
}

export interface IncomeConfig {
  in_hand: number
  allocations: Record<string, IncomeAllocation>
}

export interface WealthDashboardResponse {
  month_year: string
  rows: WealthRow[]
  totals: WealthTotals
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

export const authApi = {
  login: async (username: string, password: string): Promise<string> => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || 'Login failed')
    }
    const data = await res.json()
    setToken(data.access_token)
    return data.access_token
  },

  register: async (username: string, password: string): Promise<string> => {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.detail || 'Registration failed')
    }
    const data = await res.json()
    setToken(data.access_token)
    return data.access_token
  },
}

export const api = {
  getDashboard: (month: string) =>
    request<DashboardResponse>(`/api/dashboard/${month}`),

  getExpenses: (month: string) =>
    request<ExpenseOut[]>(`/api/expenses/?month=${month}`),

  createExpense: (body: ExpenseCreate) =>
    request<ExpenseOut>('/api/expenses/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  updateExpense: (id: number, body: ExpenseCreate) =>
    request<ExpenseOut>(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  deleteExpense: (id: number) =>
    request<void>(`/api/expenses/${id}`, { method: 'DELETE' }),

  getDefaultBudget: () =>
    request<BudgetResponse>('/api/budgets/default'),

  setDefaultBudget: (entries: BudgetEntry[]) =>
    request<BudgetResponse>('/api/budgets/default', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    }),

  getBudgets: (month: string) =>
    request<BudgetResponse>(`/api/budgets/${month}`),

  setBudgets: (month: string, entries: BudgetEntry[]) =>
    request<BudgetResponse>(`/api/budgets/${month}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    }),

  getCategories: () =>
    request<Category[]>('/api/categories/'),

  createCategory: (name: string, kind: CategoryKind = 'Need') =>
    request<Category[]>('/api/categories/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, kind }),
    }),

  updateCategoryKind: (name: string, kind: CategoryKind) =>
    request<Category[]>(`/api/categories/${name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind }),
    }),

  deleteCategory: (name: string) =>
    request<Category[]>(`/api/categories/${name}`, { method: 'DELETE' }),

  getFamily: () =>
    request<string[]>('/api/family/'),

  createFamilyMember: (name: string) =>
    request<string[]>('/api/family/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  deleteFamilyMember: (name: string) =>
    request<string[]>(`/api/family/${name}`, { method: 'DELETE' }),

  getSources: () =>
    request<string[]>('/api/sources/'),

  createSource: (name: string) =>
    request<string[]>('/api/sources/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  deleteSource: (name: string) =>
    request<string[]>(`/api/sources/${name}`, { method: 'DELETE' }),

  getIncome: () =>
    request<IncomeConfig>('/api/income/'),

  setIncome: (body: IncomeConfig) =>
    request<IncomeConfig>('/api/income/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  getAssets: () =>
    request<AssetOut[]>('/api/assets/'),

  createAsset: (body: { asset_name: string; category: string; expected_return: number }) =>
    request<AssetOut>('/api/assets/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  deleteAsset: (asset_id: number) =>
    request<void>(`/api/assets/${asset_id}`, { method: 'DELETE' }),

  getWealthDashboard: (month: string) =>
    request<WealthDashboardResponse>(`/api/wealth/${month}`),

  getWealthRatios: () =>
    request<{ sharpe: number | null; sortino: number | null; months: number; risk_free: number }>('/api/wealth/ratios'),

  createHolding: (body: { asset_id: number; month_year: string; invested_value: number; market_value: number; use_expected_return?: boolean }) =>
    request<HoldingOut>('/api/holdings/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  updateHolding: (id: number, body: { invested_value: number; market_value: number; use_expected_return?: boolean }) =>
    request<HoldingOut>(`/api/holdings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  deleteHolding: (id: number) =>
    request<void>(`/api/holdings/${id}`, { method: 'DELETE' }),

  listBooks: () => request<BookMeta[]>('/api/library/'),

  getBook: async (slug: string): Promise<string> => {
    const token = getToken()
    const res = await fetch(`${BASE}/api/library/${slug}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (res.status === 401) { clearToken(); window.location.href = '/login'; throw new Error('Unauthorized') }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  },
}
