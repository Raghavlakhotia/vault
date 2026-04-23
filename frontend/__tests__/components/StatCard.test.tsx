import { render, screen } from '@testing-library/react'
import StatCard from '@/components/StatCard'

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard label="Total Spent" value="₹24,800" />)
    expect(screen.getByText('Total Spent')).toBeInTheDocument()
    expect(screen.getByText('₹24,800')).toBeInTheDocument()
  })

  it('applies a custom value class', () => {
    render(<StatCard label="Remaining" value="₹10,000" valueClass="text-green-400" />)
    const value = screen.getByText('₹10,000')
    expect(value).toHaveClass('text-green-400')
  })

  it('uses neutral color by default', () => {
    render(<StatCard label="Budget" value="₹35,000" />)
    const value = screen.getByText('₹35,000')
    expect(value).toHaveClass('text-[#e4e6f0]')
  })
})
