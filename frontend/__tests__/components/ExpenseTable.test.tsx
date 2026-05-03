import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ExpenseTable from '@/components/ExpenseTable'
import type { ExpenseOut } from '@/lib/api'

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  api: {
    deleteExpense: jest.fn(),
    getFamily: jest.fn().mockResolvedValue(['Husband', 'Wife']),
  },
}))

import { api } from '@/lib/api'

function expense(over: Partial<ExpenseOut> = {}): ExpenseOut {
  return {
    id: 1,
    amount: 100,
    category: 'Groceries',
    description: '',
    paid_by: 'Husband',
    source: '',
    date: '2026-04-15',
    ...over,
  }
}

beforeEach(() => {
  ;(api.deleteExpense as jest.Mock).mockReset()
})

describe('ExpenseTable filtering', () => {
  const expenses = [
    expense({ id: 1, paid_by: 'Husband', amount: 100 }),
    expense({ id: 2, paid_by: 'Wife', amount: 200 }),
    expense({ id: 3, paid_by: 'Husband', amount: 300 }),
  ]

  it('shows all expenses by default', async () => {
    render(<ExpenseTable expenses={expenses} onDelete={() => {}} />)
    // Wait for family to load and filter buttons to render
    await screen.findByRole('button', { name: 'Husband' })
    expect(screen.getByText('₹100')).toBeInTheDocument()
    expect(screen.getByText('₹200')).toBeInTheDocument()
    expect(screen.getByText('₹300')).toBeInTheDocument()
    expect(screen.getByText('3 expenses')).toBeInTheDocument()
  })

  it('filters by Husband', async () => {
    render(<ExpenseTable expenses={expenses} onDelete={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Husband' }))
    expect(screen.getByText('₹100')).toBeInTheDocument()
    expect(screen.queryByText('₹200')).not.toBeInTheDocument()
    expect(screen.getByText('₹300')).toBeInTheDocument()
    expect(screen.getByText('2 expenses')).toBeInTheDocument()
  })

  it('filters by Wife', async () => {
    render(<ExpenseTable expenses={expenses} onDelete={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Wife' }))
    expect(screen.queryByText('₹100')).not.toBeInTheDocument()
    expect(screen.getByText('₹200')).toBeInTheDocument()
    expect(screen.getByText('1 expense')).toBeInTheDocument()
  })

  it('shows "No expenses found." when filter result is empty', async () => {
    render(<ExpenseTable expenses={[expense({ paid_by: 'Husband' })]} onDelete={() => {}} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Wife' }))
    expect(screen.getByText('No expenses found.')).toBeInTheDocument()
  })
})

describe('ExpenseTable delete flow', () => {
  it('calls api.deleteExpense and onDelete on success', async () => {
    ;(api.deleteExpense as jest.Mock).mockResolvedValue(undefined)
    const onDelete = jest.fn()
    render(<ExpenseTable expenses={[expense({ id: 42 })]} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Delete expense'))
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(42))
    expect(api.deleteExpense).toHaveBeenCalledWith(42)
  })

  it('surfaces an error message and does not call onDelete on failure', async () => {
    ;(api.deleteExpense as jest.Mock).mockRejectedValue(new Error('boom'))
    const onDelete = jest.fn()
    render(<ExpenseTable expenses={[expense({ id: 42 })]} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Delete expense'))
    expect(await screen.findByText(/Failed to delete expense/)).toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()
  })
})

describe('ExpenseTable rendering', () => {
  it('renders dash for empty description', () => {
    render(<ExpenseTable expenses={[expense({ description: '' })]} onDelete={() => {}} />)
    // Match the description cell specifically
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('renders dash for empty source', () => {
    render(<ExpenseTable expenses={[expense({ source: '' })]} onDelete={() => {}} />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('renders source value when present', () => {
    render(<ExpenseTable
      expenses={[expense({ source: 'Credit Card' })]}
      onDelete={() => {}}
    />)
    expect(screen.getByText('Credit Card')).toBeInTheDocument()
  })

  it('formats date as "D Mon"', () => {
    render(<ExpenseTable
      expenses={[expense({ date: '2026-04-22' })]}
      onDelete={() => {}}
    />)
    expect(screen.getByText('22 Apr')).toBeInTheDocument()
  })
})

describe('ExpenseTable edit button', () => {
  it('does NOT render an edit button when onEdit is not provided', () => {
    render(<ExpenseTable expenses={[expense()]} onDelete={() => {}} />)
    expect(screen.queryByLabelText('Edit expense')).not.toBeInTheDocument()
  })

  it('renders edit button and fires onEdit with the row when clicked', () => {
    const onEdit = jest.fn()
    const e = expense({ id: 42, amount: 555 })
    render(
      <ExpenseTable
        expenses={[e]}
        onDelete={() => {}}
        onEdit={onEdit}
      />,
    )
    fireEvent.click(screen.getByLabelText('Edit expense'))
    expect(onEdit).toHaveBeenCalledWith(e)
  })
})
