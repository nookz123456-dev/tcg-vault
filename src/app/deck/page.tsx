'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useDecks, deckCount, type Deck } from '@/lib/decks'
import { useT } from '@/lib/i18n'
import { formatTHB } from '@/lib/marvel'

export default function DecksPage() {
  const tt = useT()
  const router = useRouter()
  const { decks, createDeck, deleteDeck } = useDecks()
  const [name, setName] = useState('')
  const [prices, setPrices] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('/api/admin/marvel-prices').then((r) => r.json()).then((d) => setPrices(d.prices || {})).catch(() => {})
  }, [])

  const deckValue = (d: Deck) => Object.entries(d.cards).reduce((s, [id, q]) => s + (prices[id] || 0) * q, 0)
  const sorted = useMemo(() => [...decks].sort((a, b) => b.updatedAt - a.updatedAt), [decks])

  function create() {
    const id = createDeck(name)
    setName('')
    router.push(`/deck/${id}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <div className="section-eyebrow mb-2">🃏 Deck Builder</div>
          <h1 className="section-title neon-title text-4xl sm:text-5xl font-extrabold">{tt('mhr.deck.title')}</h1>
          <p className="text-sm text-muted mt-3">{tt('mhr.deck.subtitle')}</p>
        </div>

        {/* create */}
        <div className="mv-panel rounded-2xl p-4 mb-6 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder={tt('mhr.deck.newName')}
            className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-line text-sm text-hero placeholder:text-faint focus:outline-none focus:border-cosmic/60"
          />
          <button onClick={create} className="px-5 py-2.5 rounded-xl btn-primary text-sm font-bold whitespace-nowrap">+ {tt('mhr.deck.create')}</button>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🃏</div>
            <p className="text-lg font-semibold text-hero">{tt('mhr.deck.empty')}</p>
            <p className="text-sm text-muted mt-2">{tt('mhr.deck.emptyHint')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((d) => (
              <div key={d.id} className="mv-panel rounded-2xl p-4 flex items-center gap-4">
                <Link href={`/deck/${d.id}`} className="flex-1 min-w-0">
                  <div className="text-base font-bold text-hero truncate hover:text-cosmic transition-colors">{d.name}</div>
                  <div className="text-xs text-muted mt-1">
                    <span className="text-body font-semibold">{deckCount(d)}</span> {tt('mhr.deck.cards')} · {tt('mhr.deck.value')} <span className="text-gold-bright font-semibold">{formatTHB(deckValue(d))}</span>
                  </div>
                </Link>
                <Link href={`/deck/${d.id}`} className="px-3 py-1.5 rounded-lg btn-ghost text-xs font-semibold shrink-0">{tt('mhr.deck.open')} →</Link>
                <button onClick={() => { if (confirm(tt('mhr.deck.deleteConfirm'))) deleteDeck(d.id) }} className="text-xs font-semibold text-muted hover:text-marvel-bright shrink-0">{tt('mhr.deck.delete')}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
