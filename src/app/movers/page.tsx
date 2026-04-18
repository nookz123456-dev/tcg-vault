'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
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

export default function MoversPage() {
  const t = useT()
  const { locale } = useLocale()
  const isThai = locale === 'th'
  const [movers, setMovers] = useState<{ gainers: MoverCard[]; losers: MoverCard[] }>({ gainers: [], losers: [] })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'gainers' | 'losers' | 'all'>('gainers')
  const [gameFilter, setGameFilter] = useState<'all' | 'pokemon' | 'onepiece'>('all')

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
    if (card.game === 'onepiece') return `/card/onepiece/${card.name}`
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#1e2235] tracking-tight">
            📈 {t('movers.title') || 'Top Movers Today'}
          </h1>
          <p className="text-sm text-[#8b8fa6] mt-1">
            {t('movers.subtitle') || 'Cards with the biggest price changes'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Direction tabs */}
          <div className="flex bg-[#f5f6fa] rounded-xl p-1">
            {tabs.map(tabItem => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
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

          {/* Game filter */}
          <div className="flex bg-[#f5f6fa] rounded-xl p-1">
            {gameTabs.map(g => (
              <button
                key={g.key}
                onClick={() => setGameFilter(g.key)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1,2,3,4,5,6,7,8,9,10].map(i => (
              <div key={i} className="shimmer h-56 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-[#8b8fa6]">{t('movers.noData') || 'No data yet'}</p>
          </div>
        ) : (
          <>
            {/* Desktop: Table view */}
            <div className="hidden md:block">
              <div className="bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e8eaf0]">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">#</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">{t('movers.card') || 'Card'}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">{isThai ? 'เกม' : 'Game'}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">{isThai ? 'เซ็ต' : 'Set'}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">{t('movers.price') || 'Price'}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-[#6366f1] uppercase tracking-wider">{t('movers.change') || 'Change'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((card, i) => (
                      <tr key={`${card.game}-${card.setId}-${card.number}`} className="border-b border-[#f5f6fa] last:border-0 hover:bg-[#fafbfc] transition-colors">
                        <td className="px-5 py-3">
                          <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-bold text-white ${
                            card.direction === 'up' ? 'bg-emerald-500' : 'bg-red-500'
                          }`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <a href={getCardLink(card)} className="flex items-center gap-3 group">
                            <img src={card.image} alt={card.name} className="w-12 h-12 object-contain rounded-lg bg-[#f5f6fa] p-1" loading="lazy" />
                            <div>
                              <p className="text-sm font-bold text-[#1e2235] group-hover:text-[#6366f1] transition-colors">{card.name}</p>
                              <p className="text-xs text-[#8b8fa6]">{card.rarity}</p>
                            </div>
                          </a>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            card.game === 'pokemon' ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {getGameLabel(card.game)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-[#5c6078]">{card.setName}</td>
                        <td className="px-5 py-3 text-right text-sm font-bold text-[#1e2235]">${card.price.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-sm font-bold ${
                            card.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {card.direction === 'up' ? '+' : ''}{card.priceChange.toFixed(2)} ({card.direction === 'up' ? '+' : ''}{card.priceChangePercent.toFixed(1)}%)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: Card grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:hidden">
              {filtered.map((card, i) => (
                <a
                  key={`${card.game}-${card.setId}-${card.number}`}
                  href={getCardLink(card)}
                  className="group bg-white border border-[#e8eaf0] rounded-xl overflow-hidden hover:shadow-md hover:border-[#6366f1]/30 transition-all"
                >
                  <div className="relative aspect-square bg-[#f5f6fa] p-3 flex items-center justify-center">
                    <img src={card.image} alt={card.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                      card.direction === 'up' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      card.direction === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {card.direction === 'up' ? '+' : ''}{card.priceChangePercent.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-xs font-bold text-[#1e2235] truncate">{card.name}</h3>
                    <p className="text-[10px] text-[#8b8fa6] truncate">{card.setName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-[#1e2235]">${card.price.toFixed(2)}</span>
                      <span className={`text-[10px] font-semibold ${card.direction === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {card.direction === 'up' ? '+' : ''}{card.priceChange.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}