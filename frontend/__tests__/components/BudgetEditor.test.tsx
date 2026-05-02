import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BudgetEditor from '@/components/BudgetEditor'

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  api: { setBudgets: jest.fn() },
}))

import { api } from '@/lib/api'

beforeEach(() => {
  ;(api.setBudgets as jest.Mock).mockReset()
})

describe('BudgetEditor', () => {
  it('renders one input per category, prefilled with budget value', () => {
    render(
      <BudgetEditor
        month="2026-04"
        categories={['Groceries', 'Rent', 'Travel']}
        budgets={{ Groceries: 5000, Rent: 20000 }}
        onSave={() => {}}
      />,
    )
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('Rent')).toBeInTheDocument()
    expect(screen.getByText('Travel')).toBeInTheDocument()

    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[]
    expect(inputs).toHaveLength(3)
    expect(inputs[0].value).toBe('5000')
    expect(inputs[1].value).toBe('20000')
    expect(inputs[2].value).toBe('')  // Travel had no budget
  })

  it('on Save: sends only entries with positive amount, calls onSave', async () => {
    ;(api.setBudgets as jest.Mock).mockResolvedValue({})
    const onSave = jest.fn()
    render(
      <BudgetEditor
        month="2026-04"
        categories={['Groceries', 'Rent', 'Travel']}
        budgets={{}}
        onSave={onSave}
      />,
    )
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '5000' } })
    fireEvent.change(inputs[1], { target: { value: '0' } })  // Should be filtered out
    fireEvent.change(inputs[2], { target: { value: '3000' } })

    fireEvent.click(screen.getByRole('button', { name: 'Save Budgets' }))

    await waitFor(() => expect(api.setBudgets).toHaveBeenCalled())
    expect(api.setBudgets).toHaveBeenCalledWith('2026-04', [
      { category: 'Groceries', amount: 5000 },
      { category: 'Travel', amount: 3000 },
    ])
    await waitFor(() => expect(onSave).toHaveBeenCalled())
  })

  it('shows error when API call fails', async () => {
    ;(api.setBudgets as jest.Mock).mockRejectedValue(new Error('Server unhappy'))
    render(
      <BudgetEditor
        month="2026-04"
        categories={['G']}
        budgets={{}}
        onSave={() => {}}
      />,
    )
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Budgets' }))
    expect(await screen.findByText('Server unhappy')).toBeInTheDocument()
  })

  it('shows ✓ Saved after a successful save', async () => {
    ;(api.setBudgets as jest.Mock).mockResolvedValue({})
    render(
      <BudgetEditor
        month="2026-04"
        categories={['G']}
        budgets={{ G: 100 }}
        onSave={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save Budgets' }))
    expect(await screen.findByText(/Saved/)).toBeInTheDocument()
  })
})
