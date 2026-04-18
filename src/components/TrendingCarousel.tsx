'use client'

import { useEffect, useState, useRef } from 'react'

interface TrendingCard {
  id: string
  name: string
  image: string
  game: 'pokemon' | 'onepiece'
  setName: string
  rarity: string
  marketPrice: number | null
  priceChange: string | null
}

export default function TrendingCarousel() {
  const [cards, setCards] = useState<TrendingCard[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  useEffect(() => {
    fetch('/api/trending')
      .then(r => r.json())
      .then(data => {
        setCards(data.cards || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll)
    checkScroll()
    return () => el.removeEventListener('scroll', checkScroll)
  }, [cards])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = 280
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (!loading && cards.length === 0) return null

  return (
    <section className="relative">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1e2235]">
              Trending Cards
            </h2>
            <p className="text-sm text-[#8b8fa6] mt-0.5">Live market prices updated in real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-10 h-10 rounded-xl border border-[#e8eaf0] bg-[#f5f6fa] flex items-center justify-center text-[#5c6078] hover:text-[#1e2235] hover:border-[#6366f1]/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-10 h-10 rounded-xl border border-[#e8eaf0] bg-[#f5f6fa] flex items-center justify-center text-[#5c6078] hover:text-[#1e2235] hover:border-[#6366f1]/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[260px] snap-start">
              <div className="bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden">
                <div className="shimmer w-full h-[220px]" />
                <div className="p-4 space-y-2">
                  <div className="shimmer h-4 w-3/4 rounded" />
                  <div className="shimmer h-3 w-1/2 rounded" />
                  <div className="shimmer h-5 w-1/3 rounded mt-3" />
                </div>
              </div>
            </div>
          ))
        ) : (
          cards.map((card, i) => (
            <div
              key={card.id}
              className="flex-shrink-0 w-[260px] snap-start group"
            >
              <div className="bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden hover:border-[#6366f1]/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1">
                {/* Card image */}
                <div className="relative w-full h-[220px] bg-[#f5f6fa] flex items-center justify-center overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    loading={i < 3 ? 'eager' : 'lazy'}
                  />
                  {/* Game badge */}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    card.game === 'pokemon'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {card.game === 'pokemon' ? 'Pokemon' : 'One Piece'}
                  </span>
                  {/* Rank - removed per Boss request */}
                </div>

                {/* Card info */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-[#1e2235] truncate">
                    {card.name}
                  </h3>
                  <p className="text-xs text-[#8b8fa6] truncate mt-0.5">
                    {card.setName}
                  </p>
                  {card.rarity && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#6366f1]/10 text-[#6366f1] text-[10px] font-medium rounded-md border border-[#6366f1]/20">
                      {card.rarity}
                    </span>
                  )}

                  {/* Price */}
                  <div className="mt-3 pt-3 border-t border-[#e8eaf0]">
                    {card.marketPrice ? (
                      <div>
                        <span className="text-xs text-[#8b8fa6]">Market Price</span>
                        <div className="text-lg font-bold text-emerald-500">
                          ${card.marketPrice.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs text-[#8b8fa6]">Price</span>
                        <div className="text-sm text-gray-600 italic">
                          Check marketplace
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fade edges */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-[var(--background)] to-transparent pointer-events-none z-10" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none z-10" />
      )}
    </section>
  )
}