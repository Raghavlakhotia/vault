'use client'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api, BookMeta } from '@/lib/api'

function LibraryInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedSlug = searchParams.get('book') ?? ''

  const [books, setBooks] = useState<BookMeta[]>([])
  const [content, setContent] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [loadingContent, setLoadingContent] = useState(false)

  useEffect(() => {
    api.listBooks().then((b) => { setBooks(b); setLoadingBooks(false) })
  }, [])

  const fetchContent = useCallback(async (slug: string) => {
    if (!slug) return
    setLoadingContent(true)
    try {
      setContent(await api.getBook(slug))
    } finally {
      setLoadingContent(false)
    }
  }, [])

  useEffect(() => { fetchContent(selectedSlug) }, [selectedSlug, fetchContent])

  // Auto-select first book on load
  useEffect(() => {
    if (!selectedSlug && books.length > 0) {
      router.replace(`/library?book=${books[0].slug}`)
    }
  }, [books, selectedSlug, router])

  function selectBook(slug: string) {
    router.push(`/library?book=${slug}`)
  }

  const selectedBook = books.find((b) => b.slug === selectedSlug)

  return (
    <div className="flex h-[calc(100vh-52px)] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 flex flex-col bg-[#13161f] border-r border-white/[0.07] transition-all duration-200 ${
          sidebarOpen ? 'w-64' : 'w-12'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 h-11 border-b border-white/[0.07] flex-shrink-0">
          {sidebarOpen && (
            <span className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider">Books</span>
          )}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="w-6 h-6 flex items-center justify-center rounded text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.06] transition-colors ml-auto"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {sidebarOpen
                ? <><path d="M10 3L5 8l5 5" /></>
                : <><path d="M6 3l5 5-5 5" /></>
              }
            </svg>
          </button>
        </div>

        {/* Book list */}
        <nav className="flex-1 overflow-y-auto py-1">
          {loadingBooks ? (
            <div className="px-3 py-4 text-[12px] text-[#6b7280]">Loading…</div>
          ) : (
            books.map((book) => {
              const isActive = book.slug === selectedSlug
              return (
                <button
                  key={book.slug}
                  onClick={() => selectBook(book.slug)}
                  title={sidebarOpen ? undefined : `${book.title} — ${book.author}`}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 transition-colors ${
                    isActive
                      ? 'bg-violet-500/10 text-violet-300'
                      : 'text-[#9ca3af] hover:text-[#e4e6f0] hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={`flex-shrink-0 text-[11px] font-mono font-semibold w-5 text-center ${isActive ? 'text-violet-400' : 'text-[#4b5563]'}`}>
                    {String(book.order).padStart(2, '0')}
                  </span>
                  {sidebarOpen && (
                    <span className="text-[12px] leading-snug truncate">{book.title}</span>
                  )}
                </button>
              )
            })
          )}
        </nav>
      </aside>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto">
        {!selectedSlug ? (
          <div className="flex items-center justify-center h-full text-[#6b7280] text-[13px]">
            Select a book from the sidebar
          </div>
        ) : loadingContent ? (
          <div className="flex items-center justify-center h-full text-[#6b7280] text-[13px]">Loading…</div>
        ) : (
          <div className="max-w-3xl mx-auto px-8 py-8">
            {selectedBook && (
              <div className="mb-6 pb-5 border-b border-white/[0.07]">
                <h1 className="text-[20px] font-semibold text-[#e4e6f0]">{selectedBook.title}</h1>
                <p className="text-[13px] text-[#6b7280] mt-1">{selectedBook.author}</p>
              </div>
            )}
            <div className="prose-vault">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-52px)] text-[#6b7280] text-[13px]">Loading…</div>}>
      <LibraryInner />
    </Suspense>
  )
}
