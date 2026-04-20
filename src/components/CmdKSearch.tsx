'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '@/lib/i18n'

interface QuickResult {
  id: string
  name: string
  image: string
  game: string
  setName: string
}

export function CmdKSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QuickResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const t = useT()

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
        setQuery('')
        setResults([])
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounced search
  const searchTimer = useRef<NodeJS.Timeout | null>(null)
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const [pokeRes, jpRes] = await Promise.all([
        fetch(`/api/cards/pokemon?q=${encodeURIComponent(q)}&pageSize=6`).then(r => r.json()).catch(() => ({ cards: [] })),
        fetch(`/api/cards/pokemon-jp?q=${encodeURIComponent(q)}&pageSize=4`).then(r => r.json()).catch(() => ({ cards: [] })),
      ])
      const all: QuickResult[] = []
      for (const c of (pokeRes.cards || []).slice(0, 6)) {
        all.push({ id: c.id, name: c.name, image: c.images?.small || c.images?.large || '', game: 'pokemon', setName: c.set?.name || '' })
      }
      for (const c of (jpRes.cards || []).slice(0, 4)) {
        all.push({ id: c.id || c.localId, name: c.name, image: c.image || '', game: 'pokemon-jp', setName: c.set?.name || '' })
      }
      setResults(all)
      setSelectedIdx(0)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(query), 300)
  }, [query, doSearch])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      goToResult(results[selectedIdx])
    }
  }

  const goToResult = (r: QuickResult) => {
    setOpen(false)
    if (r.game === 'pokemon') router.push(`/card/pokemon/${r.id}`)
    else if (r.game === 'pokemon-jp') router.push(`/card/pokemon-jp/${encodeURIComponent(r.id)}`)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1e2235]/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl shadow-[#1e2235]/20 border border-[#e8eaf0] overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-[#e8eaf0]">
          <svg className="w-5 h-5 text-[#8b8fa6] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder')}
            className="flex-1 py-4 text-[#1e2235] placeholder:text-[#b5b8c8] text-base bg-transparent outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-[#8b8fa6] bg-[#f5f6fa] border border-[#e8eaf0] rounded-md">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.length < 2 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-[#8b8fa6]">{t('cmdk.typeToSearch')}</p>
              <p className="text-xs text-[#b5b8c8] mt-2">
                <kbd className="px-1.5 py-0.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded text-[10px] font-semibold">⌘K</kbd> {t('cmdk.shortcutHint')}
              </p>
            </div>
          ) : loading ? (
            <div className="py-8 text-center text-sm text-[#8b8fa6]">{t('search.searching')}</div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#8b8fa6]">{t('search.noResults')}</div>
          ) : (
            <div className="py-2">
              {results.map((r, i) => (
                <button
                  key={`${r.game}-${r.id}`}
                  onClick={() => goToResult(r)}
                  onMouseEnter={() => setSelectedIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selectedIdx ? 'bg-[#6366f1]/5' : 'hover:bg-[#fafbfc]'
                  }`}
                >
                  <div className="w-10 h-14 bg-[#f5f6fa] rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {r.image ? <img src={r.image} alt="" className="w-full h-full object-contain" /> : <span className="text-lg opacity-30">🃏</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1e2235] truncate">{r.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        r.game === 'pokemon-jp' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-[#6366f1]/10 text-[#6366f1]'
                      }`}>{r.game === 'pokemon-jp' ? 'JP' : 'EN'}</span>
                      <span className="text-xs text-[#8b8fa6] truncate">{r.setName}</span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-[#b5b8c8] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#e8eaf0] bg-[#fafbfc] text-[10px] text-[#b5b8c8]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white border border-[#e8eaf0] rounded font-semibold">↑↓</kbd> {t('cmdk.navigate')}</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white border border-[#e8eaf0] rounded font-semibold">↵</kbd> {t('cmdk.open')}</span>
          </div>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-white border border-[#e8eaf0] rounded font-semibold">esc</kbd> {t('cmdk.close')}</span>
        </div>
      </div>
    </div>
  )
}