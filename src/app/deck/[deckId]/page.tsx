'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useDecks, deckCount } from '@/lib/decks'
import { useT } from '@/lib/i18n'
import { marvelCards, RARITY_ORDER, RARITY_META, cleanMarvelName, formatTHB, type MarvelCard } from '@/lib/marvel'

export default function DeckEditor() {
  const tt = useT()
  const params = useParams()
  const deckId = String(params.deckId)
  const { decks, changeQty, removeCard, renameDeck } = useDecks()
  const deck = decks.find((d) => d.id === deckId)

  const [cards, setCards] = useState<MarvelCard[]>(marvelCards)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [q, setQ] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  useEffect(() => {
    fetch('/api/marvel/cards').then((r) => r.json()).then((d) => { if (Array.isArray(d.cards) && d.cards.length) setCards(d.cards) }).catch(() => {})
    fetch('/api/admin/marvel-prices').then((r) => r.json()).then((d) => setPrices(d.prices || {})).catch(() => {})
  }, [])

  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards])

  const matches = useMemo(() => {
    const ql = q.trim().toLowerCase()
    if (!ql) return []
    return cards.filter((c) => c.name.toLowerCase().includes(ql) || c.cardNo.toLowerCase().includes(ql)).slice(0, 10)
  }, [q, cards])

  const entries = useMemo(() => {
    if (!deck) return []
    return Object.entries(deck.cards)
      .map(([id, qty]) => ({ card: byId.get(id), qty }))
      .filter((e): e is { card: MarvelCard; qty: number } => !!e.card)
      .sort((a, b) => RARITY_ORDER.indexOf(b.card.rarity as typeof RARITY_ORDER[number]) - RARITY_ORDER.indexOf(a.card.rarity as typeof RARITY_ORDER[number]) || a.card.cardNo.localeCompare(b.card.cardNo))
  }, [deck, byId])

  const totalValue = useMemo(() => entries.reduce((s, e) => s + (prices[e.card.id] || 0) * e.qty, 0), [entries, prices])
  const rarityBreak = useMemo(() => {
    const m: Record<string, number> = {}
    for (const e of entries) m[e.card.rarity] = (m[e.card.rarity] || 0) + e.qty
    return m
  }, [entries])

  if (decks.length === 0 && !deck) {
    // hooks still loading from localStorage on first paint
  }
  if (decks.length > 0 && !deck) {
    return (
      <div className="min-h-screen flex flex-col"><Navbar />
        <div className="flex-1 grid place-items-center text-center px-4">
          <div>
            <p className="text-lg font-semibold text-hero">{tt('mhr.deck.notFound')}</p>
            <Link href="/deck" className="inline-block mt-4 text-cosmic hover:text-cosmic-cyan text-sm font-semibold">← {tt('mhr.deck.back')}</Link>
          </div>
        </div>
      </div>
    )
  }

  const total = deck ? deckCount(deck) : 0

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/deck" className="text-xs text-cosmic hover:text-cosmic-cyan font-semibold">← {tt('mhr.deck.back')}</Link>

        {/* deck header */}
        <div className="flex items-center gap-3 mt-3 mb-6">
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => { renameDeck(deckId, nameDraft); setEditingName(false) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { renameDeck(deckId, nameDraft); setEditingName(false) } }}
              className="flex-1 px-3 py-2 rounded-lg bg-surface border border-cosmic/60 text-2xl font-extrabold text-hero focus:outline-none"
            />
          ) : (
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-hero flex-1 truncate">{deck?.name}</h1>
          )}
          <button onClick={() => { setNameDraft(deck?.name || ''); setEditingName(true) }} className="text-xs text-muted hover:text-cosmic font-semibold shrink-0">{tt('mhr.deck.rename')}</button>
        </div>

        {/* stats */}
        <div className="mv-panel rounded-2xl p-4 mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div><span className="font-display text-2xl font-extrabold text-hero">{total}</span> <span className="text-xs text-muted">{tt('mhr.deck.totalCards')}</span></div>
          <div className="w-px h-8 bg-line hidden sm:block" />
          <div><span className="text-xs text-muted">{tt('mhr.deck.totalValue')} </span><span className="font-display text-2xl font-extrabold text-gold-bright">{formatTHB(totalValue)}</span></div>
          {total > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
              {RARITY_ORDER.filter((r) => rarityBreak[r]).map((r) => (
                <span key={r} className={`rarity-chip text-[11px] px-2 py-0.5 rounded border ${RARITY_META[r]?.cls || ''}`}>{r} {rarityBreak[r]}</span>
              ))}
            </div>
          )}
        </div>

        {/* add cards */}
        <div className="mv-panel rounded-2xl p-4 mb-5">
          <div className="text-sm font-bold text-hero mb-2">{tt('mhr.deck.addCards')}</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tt('mhr.deck.search')}
            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-line text-sm text-hero placeholder:text-faint focus:outline-none focus:border-cosmic/60"
          />
          {matches.length > 0 && (
            <div className="mt-2 space-y-1">
              {matches.map((c) => {
                const inDeck = deck?.cards[c.id] || 0
                return (
                  <div key={c.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt="" className="w-8 h-11 object-cover rounded border border-line" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-body truncate">{cleanMarvelName(c.name)}</div>
                      <div className="text-[11px] text-faint">{c.cardNo} · <span className={RARITY_META[c.rarity]?.cls ? 'text-body' : ''}>{c.rarity}</span> · {formatTHB(prices[c.id])}</div>
                    </div>
                    {inDeck > 0 && <span className="text-xs text-gold-bright font-bold">×{inDeck}</span>}
                    <button onClick={() => changeQty(deckId, c.id, 1)} className="grid place-items-center w-8 h-8 rounded-lg btn-primary text-lg font-bold shrink-0">+</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* deck list */}
        {total === 0 ? (
          <div className="text-center py-12 text-muted text-sm">{tt('mhr.deck.deckEmpty')}</div>
        ) : (
          <div className="mv-panel rounded-2xl overflow-hidden divide-y divide-line/50">
            {entries.map(({ card, qty }) => {
              const rar = RARITY_META[card.rarity]
              const price = prices[card.id]
              return (
                <div key={card.id} className="flex items-center gap-3 px-3 sm:px-4 py-3">
                  <Link href={`/card/marvel/${card.id}`} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={card.image} alt="" className="w-10 h-14 object-cover rounded-lg border border-line" loading="lazy" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-hero truncate">{cleanMarvelName(card.name)}</div>
                    <div className="flex items-center gap-2 text-[11px] text-faint mt-0.5">
                      <span>{card.cardNo}</span>
                      <span className={`rarity-chip px-1.5 py-0.5 rounded border ${rar?.cls || ''}`}>{card.rarity}</span>
                      <span className={price != null ? 'text-gold-bright font-semibold' : ''}>{formatTHB(price)}</span>
                    </div>
                  </div>
                  {/* qty stepper */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => changeQty(deckId, card.id, -1)} className="grid place-items-center w-8 h-8 rounded-lg btn-ghost text-lg font-bold">−</button>
                    <span className="w-6 text-center font-bold text-hero">{qty}</span>
                    <button onClick={() => changeQty(deckId, card.id, 1)} className="grid place-items-center w-8 h-8 rounded-lg btn-ghost text-lg font-bold">+</button>
                    <button onClick={() => removeCard(deckId, card.id)} className="ml-1 text-xs font-semibold text-muted hover:text-marvel-bright">✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
