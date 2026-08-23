'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import WishlistButton from '@/components/WishlistButton'
import { useWishlist } from '@/lib/wishlist'
import { useT } from '@/lib/i18n'
import { marvelCards, RARITY_META, cleanMarvelName, formatTHB, type MarvelCard } from '@/lib/marvel'

export default function WishlistPage() {
  const tt = useT()
  const { ids, count, clear } = useWishlist()
  const [cards, setCards] = useState<MarvelCard[]>(marvelCards)
  const [prices, setPrices] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('/api/marvel/cards').then((r) => r.json()).then((d) => { if (Array.isArray(d.cards) && d.cards.length) setCards(d.cards) }).catch(() => {})
    fetch('/api/admin/marvel-prices').then((r) => r.json()).then((d) => setPrices(d.prices || {})).catch(() => {})
  }, [])

  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards])
  const items = useMemo(() => ids.map((id) => byId.get(id)).filter((c): c is MarvelCard => !!c), [ids, byId])
  const totalValue = useMemo(() => items.reduce((sum, c) => sum + (prices[c.id] || 0), 0), [items, prices])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <div className="section-eyebrow mb-2">⭐ Wishlist</div>
          <h1 className="section-title neon-title text-4xl sm:text-5xl font-extrabold">{tt('mhr.wl.title')}</h1>
          <p className="text-sm text-muted mt-3">{tt('mhr.wl.subtitle')}</p>
        </div>

        {count === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⭐</div>
            <p className="text-lg font-semibold text-hero">{tt('mhr.wl.empty')}</p>
            <p className="text-sm text-muted mt-2">{tt('mhr.wl.emptyHint')}</p>
            <Link href="/card/marvel" className="inline-block mt-6 px-6 py-3 btn-primary rounded-xl font-bold text-sm">{tt('mhr.wl.browse')} →</Link>
          </div>
        ) : (
          <>
            {/* summary bar */}
            <div className="mv-panel rounded-2xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-6">
                <div><span className="font-display text-2xl font-extrabold text-hero">{count}</span> <span className="text-xs text-muted">{tt('mhr.wl.count')}</span></div>
                <div className="w-px h-8 bg-line" />
                <div><span className="text-xs text-muted">{tt('mhr.wl.totalValue')} </span><span className="font-display text-2xl font-extrabold text-gold-bright">{formatTHB(totalValue)}</span></div>
              </div>
              <button
                onClick={() => { if (confirm(tt('mhr.wl.clearConfirm'))) clear() }}
                className="text-xs font-semibold text-muted hover:text-marvel-bright transition-colors"
              >
                {tt('mhr.wl.clear')} ✕
              </button>
            </div>

            {/* grid */}
            <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {items.map((c) => {
                const rar = RARITY_META[c.rarity]
                const price = prices[c.id]
                return (
                  <div key={c.id} className="mv-card rounded-xl overflow-hidden group relative">
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <WishlistButton id={c.id} variant="icon" />
                    </div>
                    <Link href={`/card/marvel/${c.id}`}>
                      <div className="relative aspect-[63/88] bg-abyss">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.image} alt={cleanMarvelName(c.name)} className="w-full h-full object-cover" loading="lazy" />
                        <span className={`absolute top-1.5 right-1.5 rarity-chip text-[10px] px-1.5 py-0.5 rounded border ${rar?.cls || ''}`}>{c.rarity}</span>
                      </div>
                      <div className="p-2">
                        <div className="text-[11px] font-semibold text-body truncate group-hover:text-hero transition-colors">{cleanMarvelName(c.name)}</div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[10px] text-faint">{c.cardNo}</span>
                          <span className={`text-[11px] font-bold ${price != null ? 'text-gold-bright' : 'text-faint'}`}>{formatTHB(price)}</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
