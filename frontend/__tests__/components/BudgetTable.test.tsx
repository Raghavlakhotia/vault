import { render, screen, within } from '@testing-library/react'
import BudgetTable from '@/components/BudgetTable'
import type { DashboardRow } from '@/lib/api'

function row(over: Partial<DashboardRow> = {}): DashboardRow {
  return {
    category: 'Groceries',
    monthly_budget: 5000,
    prev_unused: 0,
    cumulative: 5000,
    spent: 1500,
    remaining: 3500,
    pct_used: 30,
    ...over,
  }
}

const totals = row({
  category: 'TOTAL',
  monthly_budget: 25000,
  cumulative: 30000,
  spent: 12500,
  remaining: 17500,
  pct_used: 50,
})

describe('BudgetTable', () => {
  it('renders one row per matrix entry plus a totals row', () => {
    const matrix = [row({ category: 'A' }), row({ category: 'B' })]
    render(<BudgetTable matrix={matrix} totals={totals} />)
    // Two body rows + one totals row + header
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('sorts rows alphabetically by category', () => {
    const matrix = [
      row({ category: 'Zucchini' }),
      row({ category: 'Apples' }),
      row({ category: 'Mango' }),
    ]
    render(<BudgetTable matrix={matrix} totals={totals} />)
    const cells = screen.getAllByRole('row').slice(1, -1)  // skip header + total
    const categories = cells.map((r) => within(r).getAllByRole('cell')[0].textContent)
    expect(categories).toEqual(['Apples', 'Mango', 'Zucchini'])
  })

  it('formats budget values as INR', () => {
    render(<BudgetTable matrix={[row({ monthly_budget: 12345 })]} totals={totals} />)
    expect(screen.getAllByText('₹12,345').length).toBeGreaterThan(0)
  })

  it('shows percent rounded as integer with %', () => {
    render(<BudgetTable matrix={[row({ pct_used: 32.7 })]} totals={totals} />)
    expect(screen.getByText('33%')).toBeInTheDocument()
  })

  it('prefixes "−" on negative monthly limit left', () => {
    render(<BudgetTable
      matrix={[row({ monthly_budget: 1000, spent: 1500 })]}
      totals={totals}
    />)
    expect(screen.getByText(/−₹500/)).toBeInTheDocument()
  })

  it('renders empty matrix without throwing', () => {
    render(<BudgetTable matrix={[]} totals={totals} />)
    expect(screen.getByText('Total')).toBeInTheDocument()
  })
})
