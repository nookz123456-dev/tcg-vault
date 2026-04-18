'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useT, useLocale } from '@/lib/i18n'
import { useExchangeRates } from '@/lib/useExchangeRates'

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

export default function MoversPage() {
  const t = useT()
  const { locale } = useLocale()
  const isThai = locale === 'th'
  const [movers, setMovers] = useState<{ gainers: MoverCard[]; losers: MoverCard[] }>({ gainers: [], losers: [] })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'gainers' | 'losers' | 'all'>('gainers')
  const [gameFilter, setGameFilter] = useState<'all' | 'pokemon' | 'onepiece'>('all')
  const [showTHB, setShowTHB] = useState(false)
  const { toTHB, formatUSD, formatTHB } = useExchangeRates()

  useEffect(() => {
    fetch('/api/movers')
      .then(r => r.json())
      .then(data => {
        setMovers({ gainers: data.gainers || [], losers: data.losers || [] })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getGameLabel = (game: string) => {
    if (game === 'pokemon') return 'Pokémon'
    if (game === 'onepiece') return 'One Piece'
    return game
  }

  const getCardLink = (card: MoverCard) => {
    if (card.game === 'pokemon') return `/card/pokemon/${card.setId}-${card.number}`
    if (card.game === 'onepiece') return `/card/onepiece/${card.setId}-${card.number}`
    return '#'
  }

  const getFilteredCards = (): MoverCard[] => {
    let cards: MoverCard[]
    if (tab === 'gainers') cards = movers.gainers
    else if (tab === 'losers') cards = movers.losers
    else cards = [...movers.gainers, ...movers.losers].sort((a, b) => Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent))

    if (gameFilter !== 'all') {
      cards = cards.filter(c => c.game === gameFilter)
    }
    return cards
  }

  const formatPrice = (usd: number) => {
    if (showTHB) return formatTHB(toTHB(usd))
    return formatUSD(usd)
  }

  const formatChange = (change: number) => {
    const val = showTHB ? toTHB(change) : change
    const prefix = change >= 0 ? '+' : ''
    if (showTHB) return `${prefix}฿${val.toFixed(2)}`
    return `${prefix}$${val.toFixed(2)}`
  }

  const filtered = getFilteredCards()

  const tabs: { key: 'gainers' | 'losers' | 'all'; label: string; icon: string }[] = [
    { key: 'gainers', label: t('movers.gainers') || 'Gainers', icon: '▲' },
    { key: 'losers', label: t('movers.losers') || 'Losers', icon: '▼' },
    { key: 'all', label: t('movers.all') || 'All', icon: '◆' },
  ]

  const gameTabs: { key: 'all' | 'pokemon' | 'onepiece'; label: string }[] = [
    { key: 'all', label: isThai ? 'ทั้งหมด' : 'All' },
    { key: 'pokemon', label: 'Pokémon' },
    { key: 'onepiece', label: 'One Piece' },
  ]

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header + Currency toggle */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1e2235] tracking-tight">
              📈 {t('movers.title') || 'Top Movers Today'}
            </h1>
            <p className="text-base text-[#8b8fa6] mt-1">
              {t('movers.subtitle') || 'Cards with the biggest price changes'}
            </p>
          </div>
          {/* Currency toggle */}
          <button
            onClick={() => setShowTHB(!showTHB)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#e8eaf0] rounded-xl text-sm font-semibold hover:border-[#6366f1]/30 transition-all"
          >
            <span className={showTHB ? 'text-[#8b8fa6]' : 'text-[#6366f1]'}>$ USD</span>
            <span className="text-[#b5b8c8]">/</span>
            <span className={showTHB ? 'text-[#6366f1]' : 'text-[#8b8fa6]'}>฿ THB</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex bg-[#f5f6fa] rounded-xl p-1.5">
            {tabs.map(tabItem => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  tab === tabItem.key
                    ? tabItem.key === 'gainers'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : tabItem.key === 'losers'
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'bg-white text-[#1e2235] shadow-sm'
                    : 'text-[#5c6078] hover:text-[#1e2235]'
                }`}
              >
                {tabItem.icon} {tabItem.label}
              </button>
            ))}
          </div>

          <div className="flex bg-[#f5f6fa] rounded-xl p-1.5">
            {gameTabs.map(g => (
              <button
                key={g.key}
                onClick={() => setGameFilter(g.key)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  gameFilter === g.key
                    ? 'bg-white text-[#6366f1] shadow-sm'
                    : 'text-[#5c6078] hover:text-[#1e2235]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="shimmer h-72 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg text-[#8b8fa6]">{t('movers.noData') || 'No data yet'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((card, i) => (
              <a
                key={`${card.game}-${card.setId}-${card.number}`}
                href={getCardLink(card)}
                className="group bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#6366f1]/30 transition-all"
              >
                {/* Image */}
                <div className="relative bg-[#f5f6fa] p-6 flex items-center justify-center aspect-[4/3]">
                  <img
                    src={card.image}
                    alt={card.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Rank badge */}
                  <div className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${
                    card.direction === 'up' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}>
                    {i + 1}
                  </div>
                  {/* Change percent badge */}
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold ${
                    card.direction === 'up'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {card.direction === 'up' ? '▲' : '▼'} {Math.abs(card.priceChangePercent).toFixed(1)}%
                  </div>
                </div>
                {/* Info */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      card.game === 'pokemon' ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {getGameLabel(card.game)}
                    </span>
                    <span className="text-[10px] text-[#8b8fa6]">{card.rarity}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#1e2235] truncate group-hover:text-[#6366f1] transition-colors">{card.name}</h3>
                  <p className="text-sm text-[#8b8fa6] truncate mt-0.5">{card.setName}</p>
                  <div className="flex items-end justify-between mt-3 pt-3 border-t border-[#f5f6fa]">
                    <div>
                      <p className="text-xs text-[#8b8fa6] mb-0.5">{t('movers.price') || 'Price'}</p>
                      <p className="text-xl font-extrabold text-[#1e2235]">{formatPrice(card.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#8b8fa6] mb-0.5">{t('movers.change') || 'Change'}</p>
                      <p className={`text-base font-bold ${
                        card.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatChange(card.priceChange)}
                      </p>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}