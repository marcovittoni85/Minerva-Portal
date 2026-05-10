'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'
import { getEntityUrl } from '@/lib/search-utils'

interface SearchResults {
  deals: any[]
  contacts: any[]
  documents: any[]
  semantic: {
    id: string
    type: string
    content: string
    similarity: string
  }[]
}

const emptyResults: SearchResults = {
  deals: [],
  contacts: [],
  documents: [],
  semantic: [],
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const [results, setResults] = useState<SearchResults>(emptyResults)
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // CMD+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('topbar-search')?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch results on debounced query change
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults(emptyResults)
      setLoading(false)
      return
    }

    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults({
          deals: data.deals ?? [],
          contacts: data.contacts ?? [],
          documents: data.documents ?? [],
          semantic: data.semantic ?? [],
        })
      })
      .catch(() => setResults(emptyResults))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  const hasResults =
    results.deals.length > 0 ||
    results.contacts.length > 0 ||
    results.documents.length > 0 ||
    results.semantic.length > 0

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          id="topbar-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Cerca deal, contatti, documenti... (Ctrl+K)"
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {showResults && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
          {/* Deal results */}
          {results.deals.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Deal
              </div>
              {results.deals.map((d: any) => (
                <Link
                  key={d.id}
                  href={`/portal/deals/${d.id}`}
                  className="block px-3 py-2 hover:bg-[#D4AF37]/5 text-sm text-slate-700 transition-colors"
                >
                  <span className="font-medium">{d.codice_anonimo}</span>
                  {d.settore && (
                    <span className="text-slate-400"> &middot; {d.settore}</span>
                  )}
                  {d.nome_azienda && (
                    <span className="text-slate-400"> &middot; {d.nome_azienda}</span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Contact results */}
          {results.contacts.length > 0 && (
            <div className="py-1 border-t border-slate-100">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Contatti
              </div>
              {results.contacts.map((c: any) => (
                <Link
                  key={c.id}
                  href="/portal/relationships"
                  className="block px-3 py-2 hover:bg-[#D4AF37]/5 text-sm text-slate-700 transition-colors"
                >
                  {c.full_name}{' '}
                  <span className="text-slate-400">&middot; {c.email}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Document results */}
          {results.documents.length > 0 && (
            <div className="py-1 border-t border-slate-100">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Documenti
              </div>
              {results.documents.map((doc: any) => (
                <Link
                  key={doc.id}
                  href="/portal/deals"
                  className="block px-3 py-2 hover:bg-[#D4AF37]/5 text-sm text-slate-700 transition-colors"
                >
                  {doc.file_name}
                </Link>
              ))}
            </div>
          )}

          {/* Semantic results */}
          {results.semantic.length > 0 && (
            <div className="py-1 border-t border-slate-100">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                Risultati semantici
              </div>
              {results.semantic.map((s) => (
                <Link
                  key={s.id}
                  href={getEntityUrl(s.type, s.id)}
                  className="block px-3 py-2 hover:bg-[#D4AF37]/5 text-sm text-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded bg-[#D4AF37]/10 text-[#D4AF37]">
                      {s.type}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {s.similarity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {s.content}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {/* No results */}
          {!hasResults && !loading && (
            <div className="px-3 py-4 text-sm text-slate-400 text-center">
              Nessun risultato per &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Loading state when no results yet */}
          {loading && !hasResults && (
            <div className="px-3 py-4 flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Ricerca in corso...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
