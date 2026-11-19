import { BookOpen, ChevronDown, ChevronRight, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BOOKS_CATALOG } from '../data/booksCatalog'

interface BookVaultViewProps {
  onConsultBookTopic: (bookSlug: string, bookTitle: string, prompt: string) => void
}

const BOOKS = BOOKS_CATALOG

export function BookVaultView({ onConsultBookTopic }: BookVaultViewProps) {
  const [search, setSearch] = useState('')
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)

  const totalPages = useMemo(
    () => BOOKS.reduce((acc, b) => acc + b.totalPages, 0),
    []
  )

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return BOOKS
    return BOOKS.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.tag.toLowerCase().includes(q) ||
        b.chapters.some((c) => c.title.toLowerCase().includes(q))
    )
  }, [search])

  return (
    <div className="flex flex-col pb-24">
      {/* Clinical Navy Header */}
      <div className="medscape-hero px-4 pt-4 pb-4 shadow-sm">
        <div className="mx-auto max-w-lg space-y-3">
          <div>
            <h1 className="text-base font-bold tracking-tight">Perpustakaan Buku Anes (Tier 1)</h1>
            <p className="mt-0.5 text-[11px] text-white/75 tabular-nums">
              {BOOKS.length} Buku Kanonikal · {totalPages.toLocaleString('id-ID')} Halaman Terindeks
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/12 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-white/75" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul buku atau nama bab (mis. airway, obstetric, cardiac)..."
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/65"
            />
          </div>
        </div>
      </div>

      {/* Book Catalog List */}
      <div className="mx-auto w-full max-w-lg space-y-2.5 px-4 pt-4">
        {filteredBooks.map((book) => {
          const isOpen = expandedSlug === book.slug
          const q = search.trim().toLowerCase()
          const visibleChapters = q
            ? book.chapters.filter((c) => c.title.toLowerCase().includes(q))
            : book.chapters

          return (
            <div
              key={book.slug}
              className="medscape-card overflow-hidden border border-base-300 bg-base-200"
            >
              <button
                type="button"
                onClick={() => setExpandedSlug(isOpen ? null : book.slug)}
                className="flex w-full items-center justify-between gap-3 p-3.5 text-left transition hover:bg-base-100/60"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-base-content">{book.title}</div>
                    <div className="mt-0.5 text-[11px] text-secondary tabular-nums">
                      {book.edition} · {book.totalPages.toLocaleString('id-ID')} hal ·{' '}
                      {book.totalChapters} bab
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="hidden rounded-md bg-base-100 px-2 py-0.5 text-[10px] font-semibold text-secondary sm:inline">
                    {book.tag}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-secondary" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-secondary" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-base-300 bg-base-100/60 px-3.5 py-2.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
                      Daftar Bab ({visibleChapters.length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onConsultBookTopic(
                          book.slug,
                          book.title,
                          `Ringkas poin klinis penting dari ${book.title} terkait: `
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary"
                    >
                      <Sparkles className="h-3 w-3" />
                      Tanya Buku Ini
                    </button>
                  </div>
                  <div className="max-h-64 divide-y divide-base-300/70 overflow-y-auto rounded-xl border border-base-300 bg-base-200">
                    {visibleChapters.map((ch, idx) => (
                      <button
                        key={`${book.slug}-${idx}`}
                        type="button"
                        onClick={() =>
                          onConsultBookTopic(
                            book.slug,
                            book.title,
                            `Bedah poin klinis & dosis utama pada bab "${ch.title}" (${book.title}, hal. ${ch.startPage}-${ch.endPage})`
                          )
                        }
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition hover:bg-base-100"
                      >
                        <span className="truncate font-medium text-base-content">{ch.title}</span>
                        <span className="shrink-0 font-mono text-[10px] text-secondary tabular-nums">
                          p. {ch.startPage}–{ch.endPage}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
