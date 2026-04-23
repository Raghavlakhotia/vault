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
}
