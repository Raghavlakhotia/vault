import {
  getToken,
  setToken,
  clearToken,
  isLoggedIn,
} from '@/lib/auth'

beforeEach(() => {
  localStorage.clear()
})

describe('getToken', () => {
  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull()
  })

  it('returns the stored token', () => {
    localStorage.setItem('vault_token', 'abc')
    expect(getToken()).toBe('abc')
  })
})

describe('setToken', () => {
  it('writes the token to localStorage under vault_token', () => {
    setToken('xyz')
    expect(localStorage.getItem('vault_token')).toBe('xyz')
  })

  it('overwrites a previously stored token', () => {
    setToken('first')
    setToken('second')
    expect(getToken()).toBe('second')
  })
})

describe('clearToken', () => {
  it('removes the token from localStorage', () => {
    setToken('abc')
    clearToken()
    expect(getToken()).toBeNull()
  })

  it('is a no-op when no token exists', () => {
    expect(() => clearToken()).not.toThrow()
    expect(getToken()).toBeNull()
  })
})

describe('isLoggedIn', () => {
  it('false when no token', () => {
    expect(isLoggedIn()).toBe(false)
  })

  it('true after setToken', () => {
    setToken('any')
    expect(isLoggedIn()).toBe(true)
  })

  it('false after clearToken', () => {
    setToken('any')
    clearToken()
    expect(isLoggedIn()).toBe(false)
  })
})
