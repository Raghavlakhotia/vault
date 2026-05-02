import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CategoryManager from '@/components/CategoryManager'

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  api: {
    createCategory: jest.fn(),
    deleteCategory: jest.fn(),
  },
}))

import { api } from '@/lib/api'

beforeEach(() => {
  ;(api.createCategory as jest.Mock).mockReset()
  ;(api.deleteCategory as jest.Mock).mockReset()
})

describe('CategoryManager', () => {
  it('renders all categories as pills', () => {
    render(<CategoryManager categories={['A', 'B', 'C']} onChange={() => {}} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('Add: trims input, calls api.createCategory, fires onChange, clears input', async () => {
    ;(api.createCategory as jest.Mock).mockResolvedValue(['A', 'B'])
    const onChange = jest.fn()
    render(<CategoryManager categories={['A']} onChange={onChange} />)

    const input = screen.getByPlaceholderText('Category name') as HTMLInputElement
    fireEvent.change(input, { target: { value: '  B  ' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => expect(api.createCategory).toHaveBeenCalledWith('B'))
    expect(onChange).toHaveBeenCalledWith(['A', 'B'])
    expect(input.value).toBe('')
  })

  it('Add: empty input does nothing', () => {
    render(<CategoryManager categories={[]} onChange={() => {}} />)
    const input = screen.getByPlaceholderText('Category name')
    fireEvent.submit(input.closest('form')!)
    expect(api.createCategory).not.toHaveBeenCalled()
  })

  it('Add: shows server error', async () => {
    ;(api.createCategory as jest.Mock).mockRejectedValue(new Error('Already exists'))
    render(<CategoryManager categories={[]} onChange={() => {}} />)
    const input = screen.getByPlaceholderText('Category name')
    fireEvent.change(input, { target: { value: 'X' } })
    fireEvent.submit(input.closest('form')!)
    expect(await screen.findByText('Already exists')).toBeInTheDocument()
  })

  it('Delete: opens confirm dialog, then calls api on confirm', async () => {
    ;(api.deleteCategory as jest.Mock).mockResolvedValue(['B'])
    const onChange = jest.fn()
    render(<CategoryManager categories={['A', 'B']} onChange={onChange} />)
    // Find the delete button for 'A' — there are multiple delete buttons,
    // grab the first one which is on category 'A' (assuming render order)
    const deleteButtons = screen.getAllByLabelText(/Delete/)
    fireEvent.click(deleteButtons[0])

    expect(screen.getByText('Delete category?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(api.deleteCategory).toHaveBeenCalledWith('A'))
    expect(onChange).toHaveBeenCalledWith(['B'])
  })

  it('Delete: cancel closes dialog without calling api', () => {
    render(<CategoryManager categories={['A']} onChange={() => {}} />)
    fireEvent.click(screen.getAllByLabelText(/Delete/)[0])
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Delete category?')).not.toBeInTheDocument()
    expect(api.deleteCategory).not.toHaveBeenCalled()
  })
})
