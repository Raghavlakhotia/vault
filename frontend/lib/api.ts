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
  date: string
}

export interface ExpenseCreate {
  amount: number
  category: string
  description?: string
  paid_by: string
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

export interface WealthDashboardResponse {
  month_year: string
  rows: WealthRow[]
  totals: WealthTotals
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
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

  deleteExpense: (id: number) =>
    request<void>(`/api/expenses/${id}`, { method: 'DELETE' }),

  getBudgets: (month: string) =>
    request<BudgetResponse>(`/api/budgets/${month}`),

  setBudgets: (month: string, entries: BudgetEntry[]) =>
    request<BudgetResponse>(`/api/budgets/${month}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    }),

  getCategories: () =>
    request<string[]>('/api/categories/'),

  createCategory: (name: string) =>
    request<string[]>('/api/categories/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  deleteCategory: (name: string) =>
    request<string[]>(`/api/categories/${name}`, { method: 'DELETE' }),

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
}
