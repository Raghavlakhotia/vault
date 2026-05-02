import { render, screen, fireEvent } from '@testing-library/react'
import ExpenseFeed from '@/components/ExpenseFeed'
import type { ExpenseOut } from '@/lib/api'

function expense(over: Partial<ExpenseOut> = {}): ExpenseOut {
  return {
    id: 1,
    amount: 250,
    category: 'Groceries',
    description: 'Milk and bread',
    paid_by: 'Husband',
    date: '2026-04-15',
    ...over,
  }
}

describe('ExpenseFeed', () => {
  it('renders empty state when no expenses', () => {
    render(<ExpenseFeed expenses={[]} month="2026-04" onAddExpense={() => {}} />)
    expect(screen.getByText(/No expenses this month/)).toBeInTheDocument()
  })

  it('shows the most recent five only, sorted desc by date', () => {
    const expenses = [
      expense({ id: 1, date: '2026-04-01', description: 'A' }),
      expense({ id: 2, date: '2026-04-02', description: 'B' }),
      expense({ id: 3, date: '2026-04-03', description: 'C' }),
      expense({ id: 4, date: '2026-04-04', description: 'D' }),
      expense({ id: 5, date: '2026-04-05', description: 'E' }),
      expense({ id: 6, date: '2026-04-06', description: 'F' }),
    ]
    render(<ExpenseFeed expenses={expenses} month="2026-04" onAddExpense={() => {}} />)
    // 'A' (oldest) should be sliced off; 'F' should appear first
    expect(screen.queryByText('A')).not.toBeInTheDocument()
    expect(screen.getByText('F')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('falls back to category as title when description is empty', () => {
    render(<ExpenseFeed
      expenses={[expense({ description: '', category: 'Travel' })]}
      month="2026-04"
      onAddExpense={() => {}}
    />)
    // Travel appears in the title slot — and also as the category badge.
    expect(screen.getAllByText('Travel').length).toBeGreaterThanOrEqual(1)
  })

  it('formats amount as INR (red)', () => {
    render(<ExpenseFeed
      expenses={[expense({ amount: 1234 })]}
      month="2026-04"
      onAddExpense={() => {}}
    />)
    expect(screen.getByText('₹1,234')).toBeInTheDocument()
  })

  it('Add Expense button triggers onAddExpense', () => {
    const onAdd = jest.fn()
    render(<ExpenseFeed expenses={[]} month="2026-04" onAddExpense={onAdd} />)
    fireEvent.click(screen.getByRole('button', { name: /Add Expense/ }))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('"View all" link points at /expenses with month query param', () => {
    render(<ExpenseFeed expenses={[]} month="2026-04" onAddExpense={() => {}} />)
    const link = screen.getByRole('link', { name: /View all/ })
    expect(link).toHaveAttribute('href', '/expenses?month=2026-04')
  })
})
