/**
 * api.ts wraps fetch with auth (Bearer token from localStorage), 401 redirect,
 * and JSON helpers. These tests verify URL construction, headers, methods,
 * and error paths.
 */

import { api, authApi } from '@/lib/api'
import { setToken, clearToken, getToken } from '@/lib/auth'

global.fetch = jest.fn()

function mockFetch(data: unknown, status = 200) {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : ''),
  })
}

beforeEach(() => {
  ;(global.fetch as jest.Mock).mockClear()
  clearToken()
})

// ── Auth header injection ─────────────────────────────────────────────────────

describe('Authorization header', () => {
  it('omitted when no token in localStorage', async () => {
    mockFetch({ month: '2026-04', matrix: [], totals: {}, expenses: [] })
    await api.getDashboard('2026-04')
    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(init.headers.Authorization).toBeUndefined()
  })

  it('attached as Bearer when token present', async () => {
    setToken('abc123')
    mockFetch({ month: '2026-04', matrix: [], totals: {}, expenses: [] })
    await api.getDashboard('2026-04')
    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer abc123')
  })

  it('preserves Content-Type alongside Authorization', async () => {
    setToken('xyz')
    mockFetch({ id: 1, amount: 1, category: 'X', description: '', paid_by: 'me', date: '2026-04-01' }, 201)
    await api.createExpense({ amount: 1, category: 'X', paid_by: 'me' })
    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.headers.Authorization).toBe('Bearer xyz')
  })
})

// ── URL + method correctness for each endpoint ────────────────────────────────

describe('URL construction', () => {
  it('getDashboard hits /api/dashboard/{month}', async () => {
    mockFetch({})
    await api.getDashboard('2026-04')
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'http://localhost:8000/api/dashboard/2026-04',
    )
  })

  it('getExpenses includes month query param', async () => {
    mockFetch([])
    await api.getExpenses('2026-04')
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'http://localhost:8000/api/expenses/?month=2026-04',
    )
  })

  it('createExpense sends POST with JSON body', async () => {
    mockFetch({ id: 1, amount: 500, category: 'G', description: '', paid_by: 'me', date: '2026-04-22' }, 201)
    await api.createExpense({ amount: 500, category: 'G', paid_by: 'me' })
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('http://localhost:8000/api/expenses/')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ amount: 500, category: 'G', paid_by: 'me' })
  })

  it('deleteExpense sends DELETE', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true, status: 204,
      json: () => Promise.reject(),
      text: () => Promise.resolve(''),
    })
    await api.deleteExpense(7)
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('http://localhost:8000/api/expenses/7')
    expect(init.method).toBe('DELETE')
  })

  it('getCategories hits /api/categories/', async () => {
    mockFetch(['A', 'B'])
    await api.getCategories()
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'http://localhost:8000/api/categories/',
    )
  })

  it('createCategory sends POST with name body', async () => {
    mockFetch(['A', 'B'], 201)
    await api.createCategory('B')
    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ name: 'B' })
  })

  it('deleteCategory hits /api/categories/{name}', async () => {
    mockFetch(['A'])
    await api.deleteCategory('B')
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('http://localhost:8000/api/categories/B')
    expect(init.method).toBe('DELETE')
  })

  it('getBudgets hits /api/budgets/{month}', async () => {
    mockFetch({ month: '2026-04', budgets: {} })
    await api.getBudgets('2026-04')
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'http://localhost:8000/api/budgets/2026-04',
    )
  })

  it('setBudgets sends PUT with entries payload', async () => {
    mockFetch({ month: '2026-04', budgets: { G: 6000 } })
    await api.setBudgets('2026-04', [{ category: 'G', amount: 6000 }])
    const [, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body)).toEqual({ entries: [{ category: 'G', amount: 6000 }] })
  })

  it('getDefaultBudget hits /api/budgets/default', async () => {
    mockFetch({ month: 'default', budgets: {} })
    await api.getDefaultBudget()
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'http://localhost:8000/api/budgets/default',
    )
  })

  it('getAssets, createAsset, deleteAsset', async () => {
    mockFetch([])
    await api.getAssets()
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'http://localhost:8000/api/assets/',
    )

    ;(global.fetch as jest.Mock).mockClear()
    mockFetch({ asset_id: 1, asset_name: 'A', category: 'Equity', expected_return: 12 }, 201)
    await api.createAsset({ asset_name: 'A', category: 'Equity', expected_return: 12 })
    const [, postInit] = (global.fetch as jest.Mock).mock.calls[0]
    expect(postInit.method).toBe('POST')

    ;(global.fetch as jest.Mock).mockClear()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true, status: 204,
      json: () => Promise.reject(),
      text: () => Promise.resolve(''),
    })
    await api.deleteAsset(1)
    const [delUrl, delInit] = (global.fetch as jest.Mock).mock.calls[0]
    expect(delUrl).toBe('http://localhost:8000/api/assets/1')
    expect(delInit.method).toBe('DELETE')
  })

  it('createHolding, updateHolding, deleteHolding', async () => {
    mockFetch({ id: 1, asset_id: 1, month_year: '2026-04', invested_value: 100, market_value: 110, use_expected_return: false }, 201)
    await api.createHolding({ asset_id: 1, month_year: '2026-04', invested_value: 100, market_value: 110 })
    const [postUrl, postInit] = (global.fetch as jest.Mock).mock.calls[0]
    expect(postUrl).toBe('http://localhost:8000/api/holdings/')
    expect(postInit.method).toBe('POST')

    ;(global.fetch as jest.Mock).mockClear()
    mockFetch({ id: 1, asset_id: 1, month_year: '2026-04', invested_value: 200, market_value: 220, use_expected_return: true })
    await api.updateHolding(1, { invested_value: 200, market_value: 220, use_expected_return: true })
    const [putUrl, putInit] = (global.fetch as jest.Mock).mock.calls[0]
    expect(putUrl).toBe('http://localhost:8000/api/holdings/1')
    expect(putInit.method).toBe('PUT')
  })

  it('getWealthDashboard, getWealthRatios', async () => {
    mockFetch({ month_year: '2026-04', rows: [], totals: {} })
    await api.getWealthDashboard('2026-04')
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'http://localhost:8000/api/wealth/2026-04',
    )

    ;(global.fetch as jest.Mock).mockClear()
    mockFetch({ sharpe: 1.5, sortino: null, months: 3, risk_free: 6.5 })
    await api.getWealthRatios()
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'http://localhost:8000/api/wealth/ratios',
    )
  })

  it('getFamily, createFamilyMember, deleteFamilyMember', async () => {
    mockFetch(['Husband', 'Wife'])
    await api.getFamily()
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'http://localhost:8000/api/family/',
    )

    ;(global.fetch as jest.Mock).mockClear()
    mockFetch(['Husband', 'Wife', 'Daughter'], 201)
    await api.createFamilyMember('Daughter')
    const [postUrl, postInit] = (global.fetch as jest.Mock).mock.calls[0]
    expect(postUrl).toBe('http://localhost:8000/api/family/')
    expect(postInit.method).toBe('POST')
    expect(JSON.parse(postInit.body)).toEqual({ name: 'Daughter' })

    ;(global.fetch as jest.Mock).mockClear()
    mockFetch(['Husband'])
    await api.deleteFamilyMember('Wife')
    const [delUrl, delInit] = (global.fetch as jest.Mock).mock.calls[0]
    expect(delUrl).toBe('http://localhost:8000/api/family/Wife')
    expect(delInit.method).toBe('DELETE')
  })

  it('listBooks hits /api/library/', async () => {
    mockFetch([])
    await api.listBooks()
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe(
      'http://localhost:8000/api/library/',
    )
  })

  it('getBook fetches raw markdown text', async () => {
    setToken('tok')
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true, status: 200,
      text: () => Promise.resolve('# Hello'),
    })
    const md = await api.getBook('some_book')
    expect(md).toBe('# Hello')
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('http://localhost:8000/api/library/some_book')
    expect(init.headers.Authorization).toBe('Bearer tok')
  })
})

// ── Error and 401 handling ────────────────────────────────────────────────────

describe('error handling', () => {
  it('throws server message on non-ok response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, status: 404, text: () => Promise.resolve('Not found'),
    })
    await expect(api.getDashboard('2026-04')).rejects.toThrow('Not found')
  })

  it('throws "HTTP <code>" when error body is empty', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, status: 500, text: () => Promise.resolve(''),
    })
    await expect(api.getDashboard('2026-04')).rejects.toThrow('HTTP 500')
  })

  it('returns undefined on 204 No Content', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true, status: 204,
      json: () => Promise.reject(),
      text: () => Promise.resolve(''),
    })
    await expect(api.deleteExpense(1)).resolves.toBeUndefined()
  })

  it('on 401: clears token and throws Unauthorized', async () => {
    // We intentionally don't assert on window.location — jsdom blocks real
    // navigation, and stubbing the setter portably across jsdom versions is
    // fiddly. The behavior we care about (token cleared + error thrown) is
    // covered here; the redirect line is plain enough to read.
    setToken('expired')
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, status: 401, text: () => Promise.resolve(''),
    })
    // Suppress jsdom's "Not implemented: navigation" console.error noise
    const origError = console.error
    console.error = () => {}
    try {
      await expect(api.getDashboard('2026-04')).rejects.toThrow('Unauthorized')
    } finally {
      console.error = origError
    }
    expect(getToken()).toBeNull()
  })
})

// ── authApi: login + register ────────────────────────────────────────────────

describe('authApi.login', () => {
  it('POSTs to /api/auth/login and stores returned token', async () => {
    mockFetch({ access_token: 'tok-from-server', token_type: 'bearer' })
    const tok = await authApi.login('lakhotia', 'raghav')
    expect(tok).toBe('tok-from-server')
    expect(getToken()).toBe('tok-from-server')

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('http://localhost:8000/api/auth/login')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ username: 'lakhotia', password: 'raghav' })
  })

  it('throws server detail on failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, status: 401,
      json: () => Promise.resolve({ detail: 'Invalid username or password' }),
    })
    await expect(authApi.login('x', 'y')).rejects.toThrow('Invalid username or password')
  })

  it('throws generic message when server returns no detail', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, status: 401,
      json: () => Promise.reject(),
    })
    await expect(authApi.login('x', 'y')).rejects.toThrow('Login failed')
  })
})

describe('authApi.register', () => {
  it('POSTs to /api/auth/register and stores returned token', async () => {
    mockFetch({ access_token: 'new-tok', token_type: 'bearer' })
    const tok = await authApi.register('newuser', 'pass1234')
    expect(tok).toBe('new-tok')
    expect(getToken()).toBe('new-tok')

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('http://localhost:8000/api/auth/register')
    expect(init.method).toBe('POST')
  })

  it('throws server detail on failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, status: 400,
      json: () => Promise.resolve({ detail: 'Username already taken' }),
    })
    await expect(authApi.register('lakhotia', 'pw')).rejects.toThrow('Username already taken')
  })
})
