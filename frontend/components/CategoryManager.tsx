'use client'
import { useState } from 'react'
import { api } from '@/lib/api'

interface Props {
  categories: string[]
  onChange: (cats: string[]) => void
}

export default function CategoryManager({ categories, onChange }: Props) {
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingName, setDeletingName] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = input.trim()
    if (!name) return
    setAdding(true)
    setError('')
    try {
      const updated = await api.createCategory(name)
      onChange(updated)
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(name: string) {
    setDeletingName(name)
    setError('')
    try {
      const updated = await api.deleteCategory(name)
      onChange(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category')
    } finally {
      setDeletingName(null)
    }
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-3 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Category name"
          className="flex-1 bg-[#1a1d27] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[#e4e6f0] text-[13px] focus:outline-none focus:border-indigo-500/50"
        />
        <button
          type="submit"
          disabled={adding || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[13px] font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {adding ? 'Adding...' : 'Add'}
        </button>
      </form>

      {error && <p className="text-red-400 text-[12px] mb-3">{error}</p>}

      {categories.length === 0 ? (
        <p className="text-[#6b7280] text-center py-8 text-[13px]">No categories yet. Add one above.</p>
      ) : (
        <div className="bg-[#1a1d27] border border-white/[0.07] rounded-xl overflow-hidden">
          {categories.map((cat, i) => (
            <div
              key={cat}
              className={`flex items-center justify-between px-4 py-3.5 transition-opacity ${
                i < categories.length - 1 ? 'border-b border-white/[0.04]' : ''
              } ${deletingName === cat ? 'opacity-40' : ''}`}
            >
              <span className="text-[#e4e6f0] font-medium text-[13px]">{cat}</span>
              <button
                onClick={() => handleDelete(cat)}
                disabled={deletingName === cat}
                aria-label={`Delete ${cat}`}
                className="text-[#4b5563] hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
