import { api } from '@/lib/api'

global.fetch = jest.fn()

function mockFetch(data: unknown, status = 200) {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(''),
  })
}

beforeEach(() => {
  ;(global.fetch as jest.Mock).mockClear()
})

describe('api.getDashboard', () => {
  it('calls the correct endpoint and returns parsed data', async () => {
    const mock = { month: '2026-04', matrix: [], totals: {}, expenses: [] }
    mockFetch(mock)
    const result = await api.getDashboard('2026-04')
    expect(result).toEqual(mock)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/dashboard/2026-04',
      undefined,
    )
  })
})

describe('api.getExpenses', () => {
  it('passes the month query param', async () => {
    mockFetch([])
    await api.getExpenses('2026-04')
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/expenses/?month=2026-04',
      undefined,
    )
  })
})

describe('api.createExpense', () => {
  it('sends a POST and returns the created expense', async () => {
    const created = { id: 1, amount: 500, category: 'Groceries', description: '', paid_by: 'Husband', date: '2026-04-22' }
    mockFetch(created, 201)
    const result = await api.createExpense({ amount: 500, category: 'Groceries', paid_by: 'Husband' })
    expect(result).toEqual(created)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/expenses/',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

describe('api.deleteExpense', () => {
  it('sends a DELETE to the correct URL', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 204 })
    await api.deleteExpense(7)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/expenses/7',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})

describe('api.getCategories', () => {
  it('returns a list of strings', async () => {
    mockFetch(['Groceries', 'Dining Out'])
    const result = await api.getCategories()
    expect(result).toEqual(['Groceries', 'Dining Out'])
  })
})

describe('api.setBudgets', () => {
  it('sends a PUT with entries payload', async () => {
    mockFetch({ month: '2026-04', budgets: { Groceries: 6000 } })
    await api.setBudgets('2026-04', [{ category: 'Groceries', amount: 6000 }])
    const call = (global.fetch as jest.Mock).mock.calls[0]
    expect(call[0]).toBe('http://localhost:8000/api/budgets/2026-04')
    expect(call[1].method).toBe('PUT')
    expect(JSON.parse(call[1].body)).toEqual({ entries: [{ category: 'Groceries', amount: 6000 }] })
  })
})

describe('api error handling', () => {
  it('throws when the response is not ok', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not found'),
    })
    await expect(api.getDashboard('2026-04')).rejects.toThrow('Not found')
  })
})
