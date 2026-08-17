'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { MarvelCard, RARITY_META, RARITY_ORDER, ATTR_META, cleanMarvelName, formatTHB } from '@/lib/marvel'
import TiltCard from '@/components/TiltCard'

// Horizontal, arrow-scrollable showcase of large cards — the "Featured Cards"
// carousel in the expansion-page style.
export default function MarvelFeaturedCarousel({
  cards, prices,
}: {
  cards: MarvelCard[]
  prices: Record<string, number>
}) {
  const scroller = useRef<HTMLDivElement>(null)

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current
    if (!el) return
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: 'smooth' })
  }

  if (cards.length === 0) return null

  return (
    <div className="relative">
      {/* arrows */}
      <button
        onClick={() => scroll(-1)}
        aria-label="ก่อนหน้า"
        className="hidden sm:grid absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 place-items-center rounded-full mv-panel text-hero hover:text-cosmic shadow-xl"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button
        onClick={() => scroll(1)}
        aria-label="ถัดไป"
        className="hidden sm:grid absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 place-items-center rounded-full mv-panel text-hero hover:text-cosmic shadow-xl"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
      </button>

      <div ref={scroller} className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x scroll-pl-4">
        {cards.map((c) => {
          const rar = RARITY_META[c.rarity]
          const price = prices[c.id]
          const holo = RARITY_ORDER.indexOf(c.rarity as typeof RARITY_ORDER[number]) >= RARITY_ORDER.indexOf('SR')
          return (
            <Link
              key={c.id}
              href={`/card/marvel/${c.id}`}
              className="group shrink-0 w-[190px] sm:w-[220px] snap-start"
            >
              <TiltCard holo={holo} className="rounded-2xl" >
                <div className="relative rounded-2xl overflow-hidden border border-line-soft"
                     style={{ boxShadow: '0 14px 40px rgba(0,0,0,0.55)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt={cleanMarvelName(c.name)} className="w-full aspect-[63/88] object-cover" loading="lazy" />
                  <span className={`absolute top-2 right-2 rarity-chip text-[11px] px-2 py-0.5 rounded border ${rar?.cls || ''}`}>{c.rarity}</span>
                  {c.attribute && <span className={`absolute top-2 left-2 w-3 h-3 rounded-full ring-2 ring-black/40 ${ATTR_META[c.attribute]?.dot || ''}`} />}
                </div>
              </TiltCard>
              <div className="mt-2 px-0.5">
                <div className="text-sm font-semibold text-body truncate group-hover:text-hero transition-colors">{cleanMarvelName(c.name)}</div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[11px] text-faint">{c.cardNo}</span>
                  <span className={`text-sm font-bold ${price != null ? 'text-gold-bright' : 'text-faint'}`}>{formatTHB(price)}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
