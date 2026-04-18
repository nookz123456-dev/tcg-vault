'use client'

import { useState, useEffect } from 'react'
import { useT, useLocale } from '@/lib/i18n'

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

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-extrabold text-[#1e2235]">
          📈 {isThai ? 'การ์ดเคลื่อนไหววันนี้' : 'Top Movers Today'}
        </h2>
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

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="shimmer h-48 rounded-xl" />)}
        </div>
      ) : cards.length === 0 ? (
        <p className="text-sm text-[#8b8fa6]">{isThai ? 'ยังไม่มีข้อมูล' : 'No data yet'}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cards.slice(0, 4).map((card, i) => (
            <a
              key={`${card.game}-${card.setId}-${card.number}`}
              href={getCardLink(card)}
              className="group bg-white border border-[#e8eaf0] rounded-xl overflow-hidden hover:shadow-lg hover:border-[#6366f1]/30 transition-all duration-300"
            >
              {/* Image */}
              <div className="relative aspect-square bg-[#f5f6fa] p-4 flex items-center justify-center overflow-hidden">
                <img
                  src={card.image}
                  alt={card.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {/* Rank badge */}
                <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                  activeTab === 'gainers' ? 'bg-emerald-500' : 'bg-red-500'
                }`}>
                  {i + 1}
                </div>
                {/* Change badge */}
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  card.direction === 'up'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {card.direction === 'up' ? '▲' : '▼'} {Math.abs(card.priceChangePercent)}%
                </div>
              </div>
              {/* Info */}
              <div className="p-3">
                <h3 className="text-xs font-bold text-[#1e2235] truncate mb-0.5">{card.name}</h3>
                <p className="text-[10px] text-[#8b8fa6] truncate">{getGameLabel(card.game)} · {card.setName}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-sm font-extrabold text-[#1e2235]">${card.price.toFixed(2)}</span>
                  <span className={`text-[10px] font-semibold ${
                    card.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {card.direction === 'up' ? '+' : ''}{card.priceChange.toFixed(2)}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}