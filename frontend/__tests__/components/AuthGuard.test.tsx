import { render, screen } from '@testing-library/react'
import AuthGuard from '@/components/AuthGuard'
import { setToken, clearToken } from '@/lib/auth'

const mockReplace = jest.fn()
let mockPathname = '/'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
}))

beforeEach(() => {
  mockReplace.mockReset()
  clearToken()
  mockPathname = '/'
})

describe('AuthGuard', () => {
  it('redirects to /login when no token and pathname is not /login', () => {
    render(<AuthGuard><div>protected</div></AuthGuard>)
    expect(mockReplace).toHaveBeenCalledWith('/login')
    expect(screen.queryByText('protected')).not.toBeInTheDocument()
  })

  it('renders children when token is present', () => {
    setToken('valid')
    render(<AuthGuard><div>protected</div></AuthGuard>)
    expect(mockReplace).not.toHaveBeenCalled()
    expect(screen.getByText('protected')).toBeInTheDocument()
  })

  it('renders children on /login regardless of token state', () => {
    mockPathname = '/login'
    render(<AuthGuard><div>login page</div></AuthGuard>)
    expect(mockReplace).not.toHaveBeenCalled()
    expect(screen.getByText('login page')).toBeInTheDocument()
  })
})
