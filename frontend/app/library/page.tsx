'use client'

import { useState, useEffect } from 'react'
import { useVaultAuth, LoginForm } from '@/app/lib/auth'

const API = process.env.NEXT_PUBLIC_API_URL

interface BookMeta {
  slug: string
  title: string
  author: string
  order: number
}

export default function LibraryPage() {
  const { token, login } = useVaultAuth()
  const [books, setBooks] = useState<BookMeta[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [content, setContent] = useState<string>('')
  const [loadingContent, setLoadingContent] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`${API}/api/library/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setBooks)
  }, [token])

  useEffect(() => {
    if (!token || !selectedSlug) return
    setLoadingContent(true)
    fetch(`${API}/api/library/${selectedSlug}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.text() : '')
      .then(setContent)
      .finally(() => setLoadingContent(false))
  }, [token, selectedSlug])

  if (!token) return <LoginForm login={login} />

  const selectedBook = books.find(b => b.slug === selectedSlug)

  return (
    <div className="flex flex-1 bg-gray-50" style={{ minHeight: 'calc(100vh - 56px)' }}>
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">Library</h1>
          <p className="text-xs text-gray-400 mt-0.5">{books.length} books</p>
        </div>
        <ul className="p-2">
          {books.map(book => (
            <li key={book.slug}>
              <button
                onClick={() => setSelectedSlug(book.slug)}
                className={`w-full text-left px-3 py-3 rounded-md text-sm transition-colors ${
                  selectedSlug === book.slug
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium leading-snug">{book.title}</div>
                {book.author && (
                  <div className="text-xs text-gray-400 mt-0.5">{book.author}</div>
                )}
              </button>
            </li>
          ))}
          {books.length === 0 && (
            <li className="px-3 py-4 text-sm text-gray-400">No books found</li>
          )}
        </ul>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {!selectedSlug ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Select a book from the sidebar
          </div>
        ) : loadingContent ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <article className="max-w-2xl">
            {selectedBook && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{selectedBook.title}</h1>
                {selectedBook.author && (
                  <p className="text-gray-500 mt-1 text-sm">{selectedBook.author}</p>
                )}
              </div>
            )}
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
              {content}
            </pre>
          </article>
        )}
      </main>
    </div>
  )
}
