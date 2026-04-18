'use client'

import { useState, useEffect, useRef } from 'react'
import { useT, useLocale } from '@/lib/i18n'
import { useExchangeRates } from '@/lib/useExchangeRates'
import Link from 'next/link'

interface MoverCard {
  name: string
  game: string
  setId: string
  setName: string
  number: string
  rarity: string
  image: string
  price: number
  priceChange: number
  priceChangePercent: number
  direction: 'up' | 'down'
}

export default function TopMovers() {
  const t = useT()
  const { locale } = useLocale()
  const isThai = locale === 'th'
  const [movers, setMovers] = useState<{ gainers: MoverCard[]; losers: MoverCard[] }>({ gainers: [], losers: [] })
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('gainers')
  const [loading, setLoading] = useState(true)
  const [showTHB, setShowTHB] = useState(false)
  const { toTHB, formatUSD, formatTHB } = useExchangeRates()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/movers')
      .then(r => r.json())
      .then(data => {
        setMovers({ gainers: data.gainers || [], losers: data.losers || [] })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const cards = activeTab === 'gainers' ? movers.gainers : movers.losers

  const getGameLabel = (game: string) => {
    if (game === 'pokemon') return 'Pokémon'
    if (game === 'onepiece') return 'One Piece'
    return game
  }

  const getCardLink = (card: MoverCard) => {
    if (card.game === 'pokemon') return `/card/pokemon/${card.setId}-${card.number}`
    if (card.game === 'onepiece') return `/card/onepiece/${card.name}`
    return '#'
  }

  const formatPrice = (usd: number) => {
    if (showTHB) return formatTHB(toTHB(usd))
    return formatUSD(usd)
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-extrabold text-[#1e2235]">
            📈 {isThai ? 'การ์ดเคลื่อนไหววันนี้' : 'Top Movers Today'}
          </h2>
          {/* Currency toggle */}
          <button
            onClick={() => setShowTHB(!showTHB)}
            className="flex items-center gap-0.5 px-2 py-1 bg-white border border-[#e8eaf0] rounded-lg text-[11px] font-semibold hover:border-[#6366f1]/30 transition-all"
          >
            <span className={showTHB ? 'text-[#8b8fa6]' : 'text-[#6366f1]'}>$</span>
            <span className="text-[#b5b8c8]">/</span>
            <span className={showTHB ? 'text-[#6366f1]' : 'text-[#8b8fa6]'}>฿</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#f5f6fa] rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('gainers')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'gainers' ? 'bg-emerald-500 text-white shadow-sm' : 'text-[#5c6078] hover:text-emerald-600'
              }`}
            >
              ▲ {isThai ? 'ขึ้น' : 'Gainers'}
            </button>
            <button
              onClick={() => setActiveTab('losers')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'losers' ? 'bg-red-500 text-white shadow-sm' : 'text-[#5c6078] hover:text-red-600'
              }`}
            >
              ▼ {isThai ? 'ลง' : 'Losers'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[1,2,3,4].map(i => <div key={i} className="flex-shrink-0 w-[160px] shimmer h-48 rounded-xl" />)}
        </div>
      ) : cards.length === 0 ? (
        <p className="text-sm text-[#8b8fa6]">{isThai ? 'ยังไม่มีข้อมูล' : 'No data yet'}</p>
      ) : (
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#e8eaf0] scrollbar-track-transparent"
            style={{ scrollbarWidth: 'thin' }}
          >
            {cards.map((card, i) => (
              <a
                key={`${card.game}-${card.setId}-${card.number}`}
                href={getCardLink(card)}
                className="group flex-shrink-0 w-[160px] sm:w-[180px] bg-white border border-[#e8eaf0] rounded-xl overflow-hidden hover:shadow-lg hover:border-[#6366f1]/30 transition-all duration-300 snap-start"
              >
                <div className="relative aspect-square bg-[#f5f6fa] p-3 flex items-center justify-center overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                    activeTab === 'gainers' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    card.direction === 'up'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {card.direction === 'up' ? '▲' : '▼'} {Math.abs(card.priceChangePercent)}%
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-bold text-[#1e2235] truncate mb-0.5">{card.name}</h3>
                  <p className="text-[10px] text-[#8b8fa6] truncate">{getGameLabel(card.game)} · {card.setName}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm font-extrabold text-[#1e2235]">{formatPrice(card.price)}</span>
                    <span className={`text-[10px] font-semibold ${
                      card.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {card.direction === 'up' ? '+' : ''}{showTHB ? '฿' : '$'}{showTHB ? toTHB(card.priceChange).toFixed(0) : card.priceChange.toFixed(2)}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <Link
            href="/movers"
            className="block mt-3 text-center text-sm text-[#6366f1] font-semibold hover:text-[#4f46e5] transition-colors"
          >
            {isThai ? 'ดูทั้งหมด →' : 'View All →'}
          </Link>
        </div>
      )}
    </div>
  )
}