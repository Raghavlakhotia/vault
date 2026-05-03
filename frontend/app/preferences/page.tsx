'use client'
import { useState, useEffect } from 'react'
import { api, BudgetEntry } from '@/lib/api'
import { formatINR } from '@/lib/utils'

const trashIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
)

export default function PreferencesPage() {
  const [categories, setCategories] = useState<string[]>([])
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>({})
  const [family, setFamily] = useState<string[]>([])

  // Add inputs
  const [newCategory, setNewCategory] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState('')

  const [newMember, setNewMember] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [familyError, setFamilyError] = useState('')

  // Delete state — we use a confirm dialog for categories (cascade danger)
  // and direct delete for family (no cascade).
  const [deletingCat, setDeletingCat] = useState<string | null>(null)
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null)
  const [deletingMember, setDeletingMember] = useState<string | null>(null)

  // Default budget save state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [cats, defaults, fam] = await Promise.all([
          api.getCategories(),
          api.getDefaultBudget(),
          api.getFamily(),
        ])
        setCategories(cats)
        setFamily(fam)
        const init: Record<string, string> = {}
        cats.forEach((c) => { init[c] = defaults.budgets[c]?.toString() ?? '' })
        setDefaultValues(init)
      } catch {
        setLoadError('Failed to load preferences.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const defaultBudgetTotal = categories.reduce((sum, c) => {
    const n = parseFloat(defaultValues[c] ?? '')
    return sum + (Number.isFinite(n) && n > 0 ? n : 0)
  }, 0)

  // ── Family handlers ────────────────────────────────────────────────────────

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    const name = newMember.trim()
    if (!name) return
    setAddingMember(true)
    setFamilyError('')
    try {
      const updated = await api.createFamilyMember(name)
      setFamily(updated)
      setNewMember('')
    } catch (err) {
      setFamilyError(err instanceof Error ? err.message : 'Failed to add family member')
    } finally {
      setAddingMember(false)
    }
  }

  async function handleDeleteMember(name: string) {
    setDeletingMember(name)
    setFamilyError('')
    try {
      const updated = await api.deleteFamilyMember(name)
      setFamily(updated)
    } catch (err) {
      setFamilyError(err instanceof Error ? err.message : 'Failed to delete family member')
    } finally {
      setDeletingMember(null)
    }
  }

  // ── Category handlers ──────────────────────────────────────────────────────

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    const name = newCategory.trim()
    if (!name) return
    setAddingCategory(true)
    setCategoryError('')
    try {
      const updated = await api.createCategory(name)
      setCategories(updated)
      setDefaultValues((prev) => ({ ...prev, [name]: prev[name] ?? '' }))
      setNewCategory('')
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Failed to add category')
    } finally {
      setAddingCategory(false)
    }
  }

  async function handleDeleteCategory(name: string) {
    setConfirmDeleteCat(null)
    setDeletingCat(name)
    setCategoryError('')
    try {
      const updated = await api.deleteCategory(name)
      setCategories(updated)
      setDefaultValues((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Failed to delete category')
    } finally {
      setDeletingCat(null)
    }
  }

  async function handleSaveDefaults() {
    setSaving(true)
    setSaveError('')
    setSaved(false)
    try {
      const entries: BudgetEntry[] = categories
        .filter((c) => defaultValues[c] && parseFloat(defaultValues[c]) > 0)
        .map((c) => ({ category: c, amount: parseFloat(defaultValues[c]) }))
      await api.setDefaultBudget(entries)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="p-4 md:p-6 max-w-[800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[#e4e6f0] font-semibold text-[18px]">My Preferences</h1>
        <p className="text-[#6b7280] text-[13px] mt-1">
          Configure your family, categories, and default monthly budget.
        </p>
      </div>

      {loading && (
        <div className="text-[#6b7280] text-center py-12 text-[13px]">Loading...</div>
      )}
      {loadError && <p className="text-red-400 text-[12px] mb-3">{loadError}</p>}

      {!loading && !loadError && (
        <>
          {/* ── Family ───────────────────────────────────────────────── */}
          <section className="mb-10">
            <h2 className="text-[#e4e6f0] font-semibold text-[14px] mb-1">Family</h2>
            <p className="text-[#6b7280] text-[12px] mb-3">
              People who can be selected as the payer when adding an expense.
            </p>

            <form onSubmit={handleAddMember} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                placeholder="Family member name"
                disabled={addingMember}
                className="flex-1 bg-[#0f1117] border border-white/[0.07] rounded-lg px-3 py-2 text-[#e4e6f0] text-[13px] focus:outline-none focus:border-indigo-500/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={addingMember || !newMember.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[13px] font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {addingMember ? 'Adding...' : 'Add Member'}
              </button>
            </form>
            {familyError && <p className="text-red-400 text-[12px] mb-3">{familyError}</p>}

            {family.length === 0 ? (
              <p className="text-[#6b7280] text-[13px]">
                No family members yet. Add one above.
              </p>
            ) : (
              <ul className="bg-[#1a1d27] border border-white/[0.07] rounded-xl divide-y divide-white/[0.04]">
                {family.map((m) => (
                  <li
                    key={m}
                    className={`flex items-center justify-between px-3.5 py-3 transition-colors ${
                      deletingMember === m ? 'opacity-40 bg-red-500/5' : ''
                    }`}
                  >
                    <span className="text-[#e4e6f0] text-[13px] font-medium">{m}</span>
                    <button
                      onClick={() => handleDeleteMember(m)}
                      disabled={deletingMember === m}
                      aria-label={`Delete ${m}`}
                      className="text-[#4b5563] hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {trashIcon}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── Categories + Default Budget ──────────────────────────── */}
          <section>
            <h2 className="text-[#e4e6f0] font-semibold text-[14px] mb-1">Categories</h2>
            <p className="text-[#6b7280] text-[12px] mb-3">
              Add a category, then set its default monthly budget below.
            </p>

            <form onSubmit={handleAddCategory} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category name"
                disabled={addingCategory}
                className="flex-1 bg-[#0f1117] border border-white/[0.07] rounded-lg px-3 py-2 text-[#e4e6f0] text-[13px] focus:outline-none focus:border-indigo-500/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={addingCategory || !newCategory.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[13px] font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {addingCategory ? 'Adding...' : 'Add Category'}
              </button>
            </form>
            {categoryError && <p className="text-red-400 text-[12px] mb-3">{categoryError}</p>}

            {categories.length === 0 ? (
              <p className="text-[#6b7280] text-[13px] mt-4">
                No categories yet. Add one above to get started.
              </p>
            ) : (
              <>
                <div className="bg-[#1a1d27] border border-white/[0.07] rounded-xl overflow-hidden mb-5 mt-4">
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-[#13161f] border-b border-white/[0.07]">
                        <th className="py-2.5 px-3.5 text-left text-[11px] font-medium text-[#6b7280] uppercase tracking-wider">
                          Category
                        </th>
                        <th className="py-2.5 px-3.5 text-right text-[11px] font-medium text-[#6b7280] uppercase tracking-wider">
                          Monthly Budget (₹)
                        </th>
                        <th className="w-12" aria-label="Delete" />
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat) => (
                        <tr
                          key={cat}
                          className={`border-b border-white/[0.04] transition-colors ${
                            deletingCat === cat ? 'opacity-40 bg-red-500/5' : ''
                          }`}
                        >
                          <td className="py-3 px-3.5 text-[#e4e6f0] font-medium">{cat}</td>
                          <td className="py-3 px-3.5 flex justify-end">
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={defaultValues[cat] ?? ''}
                              onChange={(e) =>
                                setDefaultValues({ ...defaultValues, [cat]: e.target.value })
                              }
                              className="w-40 bg-[#0f1117] border border-white/[0.07] rounded-lg px-3 py-1.5 text-[#e4e6f0] text-[13px] text-right focus:outline-none focus:border-indigo-500/50"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <button
                              onClick={() => setConfirmDeleteCat(cat)}
                              disabled={deletingCat === cat}
                              aria-label={`Delete ${cat}`}
                              className="text-[#4b5563] hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                              {trashIcon}
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-indigo-500/[0.07] border-t border-indigo-500/20">
                        <td className="py-3 px-3.5 text-indigo-400 font-semibold text-[11px] uppercase tracking-wider">
                          Total
                        </td>
                        <td
                          aria-label="Default budget total"
                          className="py-3 px-3.5 text-right text-[#e4e6f0] font-semibold"
                        >
                          {formatINR(defaultBudgetTotal)}
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>

                {saveError && <p className="text-red-400 text-[12px] mb-3">{saveError}</p>}

                <button
                  onClick={handleSaveDefaults}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[13px] font-medium px-6 py-2.5 rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Default Budget'}
                </button>
              </>
            )}
          </section>

          {/* ── Category delete confirmation ─────────────────────────── */}
          {confirmDeleteCat && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-[#1a1d27] border border-white/[0.1] rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </div>
                  <h2 className="text-[#e4e6f0] font-semibold text-[15px]">Delete category?</h2>
                </div>
                <p className="text-[#9ca3af] text-[13px] leading-relaxed mb-6">
                  Are you sure you want to delete{' '}
                  <span className="text-[#e4e6f0] font-medium">"{confirmDeleteCat}"</span>?
                  All expenses under this category will also be permanently deleted.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setConfirmDeleteCat(null)}
                    className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#9ca3af] bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(confirmDeleteCat)}
                    className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-red-500/80 hover:bg-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  )
}
