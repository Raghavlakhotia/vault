'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import CategoryManager from '@/components/CategoryManager'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getCategories()
      .then(setCategories)
      .catch(() => setError('Failed to load categories.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="p-6 max-w-[600px] mx-auto">
      <h1 className="text-[#e4e6f0] font-semibold text-[18px] mb-6">Categories</h1>
      {loading && <div className="text-[#6b7280] text-center py-12 text-[13px]">Loading...</div>}
      {error && <div className="text-red-400 text-center py-12 text-[13px]">{error}</div>}
      {!loading && !error && (
        <CategoryManager categories={categories} onChange={setCategories} />
      )}
    </main>
  )
}
