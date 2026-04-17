'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { useWishlist } from '@/lib/useWishlist'
import { useComments } from '@/lib/useComments'
import { useAuth } from '@/lib/useAuth'

interface PriceVariant {
  key: string
  label: string
  prices: {
    low: number | null
    mid: number | null
    high: number | null
    market: number | null
    directLow: number | null
  }
}

interface CardDetail {
  id: string
  name: string
  supertype: string
  subtypes: string[]
  hp: string | null
  types: string[] | null
  evolveFrom: string | null
  rarity: string | null
  set: { id: string; name: string; series: string; printedTotal: number; total: number; releaseDate: string }
  number: string
  artist: string | null
  flavorText: string | null
  images: { small: string; large: string }
  attacks: Array<{ name: string; cost: string[]; convertedEnergyCost: number; damage: string; text: string }> | null
  abilities: Array<{ name: string; text: string; type: string }> | null
  weaknesses: Array<{ type: string; value: string }> | null
  resistances: Array<{ type: string; value: string }> | null
  retreatCost: string[] | null
  legalities: Record<string, { legal: string }> | null
  nationalPokedexNumbers: number[] | null
  tcgplayer: { url: string | null; updatedAt: string | null }
  priceBreakdown: PriceVariant[]
  cardmarket: {
    averageSellPrice: number | null
    lowPrice: number | null
    trendPrice: number | null
    suggestedPrice: number | null
    avg1: number | null
    avg7: number | null
    avg30: number | null
  } | null
  cardmarketUrl: string | null
  cardmarketUpdatedAt: string | null
  gradedPrices?: Record<string, {
    ebay?: { avg_7d: number | null; avg_30d: number | null }
    tcgplayer?: { market: number | null }
  }> | null
  conditionPrices?: {
    nearMint: { market: number | null; low: number | null; mid: number | null; high: number | null } | null
    lightlyPlayed: { market: number | null; low: number | null; mid: number | null; high: number | null } | null
    moderatelyPlayed: { market: number | null; low: number | null; mid: number | null; high: number | null } | null
    heavilyPlayed: { market: number | null; low: number | null; mid: number | null; high: number | null } | null
    damaged: { market: number | null; low: number | null; mid: number | null; high: number | null } | null
  } | null
}

const TYPE_COLORS: Record<string, string> = {
  Colorless: 'bg-gray-400',
  Darkness: 'bg-purple-600',
  Dragon: 'bg-indigo-600',
  Fairy: 'bg-pink-400',
  Fighting: 'bg-red-700',
  Fire: 'bg-orange-500',
  Grass: 'bg-green-600',
  Lightning: 'bg-yellow-500',
  Metal: 'bg-gray-500',
  Psychic: 'bg-purple-500',
  Water: 'bg-blue-500',
}

function formatPercent(current: number | null, previous: number | null): string | null {
  if (!current || !previous || previous === 0) return null
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

export default function CardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [card, setCard] = useState<CardDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [showTHB, setShowTHB] = useState(false)
  const { formatUSD, formatTHB, toUSD, toTHB } = useExchangeRates()
  const { user } = useAuth()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { comments, loading: commentsLoading, fetchComments, addComment } = useComments()
  const [newComment, setNewComment] = useState('')
  const [wishlistLoading, setWishlistLoading] = useState(false)

  // Card identifier for wishlist/comments
  const cardId = id
  const cardGame = 'pokemon'
  const wishlisted = isInWishlist(cardId, cardGame)

  // Fetch comments on mount
  useEffect(() => {
    fetchComments(cardId, cardGame)
  }, [cardId, cardGame, fetchComments])

  useEffect(() => {
    fetch(`/api/cards/pokemon/${id}`)
      .then(r => r.json())
      .then(data => {
        setCard(data)
        setLoading(false)
        // Fetch graded + condition prices from TCG Price Lookup
        fetch(`/api/prices?q=${encodeURIComponent(data.name + ' ' + data.set.name)}&game=pokemon&pageSize=5`)
          .then(r => r.json())
          .then(priceData => {
            if (priceData.data && priceData.data.length > 0) {
              const match = priceData.data.find((c: { setName: string; number: string }) =>
                c.setName?.toLowerCase().includes(data.set.name.toLowerCase())
              ) || priceData.data[0]
              setCard(prev => prev ? {
                ...prev,
                gradedPrices: match.graded || null,
                conditionPrices: match.prices ? {
                  nearMint: match.prices.nearMint || null,
                  lightlyPlayed: match.prices.lightlyPlayed || null,
                  moderatelyPlayed: match.prices.moderatelyPlayed || null,
                  heavilyPlayed: match.prices.heavilyPlayed || null,
                  damaged: match.prices.damaged || null,
                } : null,
              } : prev)
            }
          })
          .catch(() => {})
      })
      .catch(() => setLoading(false))
  }, [id])

  // Helper: format price with dual currency toggle
  const fmtPrice = (usdAmount: number | null | undefined): string => {
    if (usdAmount === null || usdAmount === undefined) return '—'
    if (showTHB) return formatTHB(toTHB(usdAmount))
    return formatUSD(usdAmount)
  }

  // Convert EUR CardMarket price to USD
  const eurToUSD = (eur: number | null): number | null => {
    if (eur === null) return null
    return toUSD(eur)
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="shimmer h-8 w-48 rounded-lg mb-8" />
          <div className="flex flex-col md:flex-row gap-8">
            <div className="shimmer w-[320px] h-[448px] rounded-xl" />
            <div className="flex-1 space-y-4">
              <div className="shimmer h-6 w-32 rounded" />
              <div className="shimmer h-10 w-64 rounded" />
              <div className="shimmer h-4 w-48 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4 opacity-50">😕</div>
          <p className="text-[#5c6078] text-lg">Card not found</p>
          <button onClick={() => router.back()} className="mt-4 text-[#6366f1] hover:text-amber-300 text-sm font-medium">
            &larr; Go back
          </button>
        </div>
      </div>
    )
  }

  const hasPrices = card.priceBreakdown.length > 0
  const hasCardmarket = card.cardmarket && card.cardmarket.trendPrice

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button + Currency toggle */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="text-[#8b8fa6] hover:text-[#1e2235] text-sm flex items-center gap-1.5 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            Back to search
          </button>
          {/* Currency toggle */}
          <button
            onClick={() => setShowTHB(!showTHB)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-lg text-xs font-semibold transition-all hover:border-[#6366f1]/30"
          >
            <span className={showTHB ? 'text-[#8b8fa6]' : 'text-[#6366f1]'}>$ USD</span>
            <span className="text-[#b5b8c8]">/</span>
            <span className={showTHB ? 'text-[#6366f1]' : 'text-[#8b8fa6]'}>฿ THB</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Card image */}
          <div className="flex-shrink-0">
            <div className="sticky top-24">
              <div className="relative w-[320px] mx-auto lg:mx-0">
                {!imgLoaded && <div className="shimmer aspect-[2.5/3.5] rounded-xl" />}
                <img
                  src={card.images.large}
                  alt={card.name}
                  className={`w-full rounded-xl shadow-2xl shadow-black/50 transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImgLoaded(true)}
                />
              </div>
            </div>
          </div>

          {/* Card info */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-yellow-500/15 text-yellow-400 rounded-lg text-xs font-medium">Pokemon</span>
                {card.supertype && <span className="px-2.5 py-0.5 bg-gray-700/50 text-[#3b3f56] rounded-lg text-xs font-medium">{card.supertype}</span>}
                {card.rarity && <span className="px-2.5 py-0.5 bg-[#6366f1]/15 text-[#6366f1] rounded-lg text-xs font-medium">{card.rarity}</span>}
              </div>
              <h1 className="text-3xl font-extrabold text-[#1e2235]">{card.name}</h1>
              <p className="text-[#8b8fa6] mt-1">{card.set.name} &middot; #{card.number}</p>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3">
              {card.hp && <span className="px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-sm font-medium">HP {card.hp}</span>}
              {card.types?.map(t => (
                <span key={t} className={`px-3 py-1.5 rounded-lg text-sm font-medium text-[#1e2235] ${TYPE_COLORS[t] || 'bg-gray-600'}`}>{t}</span>
              ))}
              {card.evolveFrom && <span className="px-3 py-1.5 bg-blue-500/15 text-blue-400 rounded-lg text-sm font-medium">Evolves from {card.evolveFrom}</span>}
            </div>

            {/* ========== PRICE BREAKDOWN ========== */}
            {hasPrices && (
              <div className="bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#e8eaf0] flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2235]">Price Guide</h2>
                    <p className="text-xs text-[#8b8fa6] mt-0.5">
                      TCGplayer market prices
                      {card.tcgplayer.updatedAt && <> &middot; Updated {new Date(card.tcgplayer.updatedAt).toLocaleDateString()}</>}
                    </p>
                  </div>
                  {card.tcgplayer.url && (
                    <a href={card.tcgplayer.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6366f1] hover:text-amber-300 font-medium">View on TCGplayer &rarr;</a>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-[#8b8fa6] uppercase tracking-wider">
                        <th className="text-left px-5 py-3 font-medium">Variant</th>
                        <th className="text-right px-4 py-3 font-medium">Market</th>
                        <th className="text-right px-4 py-3 font-medium">Low</th>
                        <th className="text-right px-4 py-3 font-medium">Mid</th>
                        <th className="text-right px-4 py-3 font-medium">High</th>
                        <th className="text-right px-5 py-3 font-medium">Direct Low</th>
                      </tr>
                    </thead>
                    <tbody>
                      {card.priceBreakdown.map((variant, i) => (
                        <tr key={variant.key} className={i % 2 === 0 ? 'bg-[#f5f6fa]/30' : ''}>
                          <td className="px-5 py-3 text-[var(--warm-200)] font-medium">{variant.label}</td>
                          <td className="text-right px-4 py-3 text-[#6366f1] font-bold">{fmtPrice(variant.prices.market)}</td>
                          <td className="text-right px-4 py-3 text-[var(--warm-200)]">{fmtPrice(variant.prices.low)}</td>
                          <td className="text-right px-4 py-3 text-[var(--warm-200)]">{fmtPrice(variant.prices.mid)}</td>
                          <td className="text-right px-4 py-3 text-[var(--warm-200)]">{fmtPrice(variant.prices.high)}</td>
                          <td className="text-right px-5 py-3 text-[#8b8fa6]">{fmtPrice(variant.prices.directLow)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========== CardMarket — EUR converted to USD ========== */}
            {hasCardmarket && (
              <div className="bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#e8eaf0] flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2235]">CardMarket Trend</h2>
                    <p className="text-xs text-[#8b8fa6] mt-0.5">
                      European market (converted to USD)
                      {card.cardmarketUpdatedAt ? ` · ${new Date(card.cardmarketUpdatedAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  {card.cardmarketUrl && (
                    <a href={card.cardmarketUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6366f1] hover:text-amber-300 font-medium">View on CardMarket &rarr;</a>
                  )}
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2 md:col-span-1 bg-[#6366f1]/10 border border-[#6366f1]/20 rounded-xl p-4">
                      <p className="text-xs text-[#6366f1]/70 font-medium uppercase tracking-wider">Trend Price</p>
                      <p className="text-2xl font-bold text-[#6366f1] mt-1">
                        {fmtPrice(eurToUSD(card.cardmarket!.trendPrice))}
                      </p>
                      {!showTHB && (
                        <p className="text-[10px] text-[#b5b8c8] mt-0.5">
                          ~{formatTHB(toTHB(eurToUSD(card.cardmarket!.trendPrice)!))} THB
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-[#8b8fa6] font-medium">Avg Sell Price</p>
                      <p className="text-lg font-semibold text-[var(--warm-200)] mt-1">{fmtPrice(eurToUSD(card.cardmarket!.averageSellPrice))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8b8fa6] font-medium">Suggested Price</p>
                      <p className="text-lg font-semibold text-[var(--warm-200)] mt-1">{fmtPrice(eurToUSD(card.cardmarket!.suggestedPrice))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8b8fa6] font-medium">Low Price</p>
                      <p className="text-lg font-semibold text-[var(--warm-200)] mt-1">{fmtPrice(eurToUSD(card.cardmarket!.lowPrice))}</p>
                    </div>
                  </div>
                  {/* Price averages */}
                  <div className="mt-4 pt-4 border-t border-[#e8eaf0]">
                    <p className="text-xs text-[#8b8fa6] font-medium mb-3 uppercase tracking-wider">Price Averages</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-[#8b8fa6]">1-Day Avg</p>
                        <p className="text-sm font-semibold text-[var(--warm-200)]">{fmtPrice(eurToUSD(card.cardmarket!.avg1))}</p>
                        {card.cardmarket!.avg1 && card.cardmarket!.avg7 && (
                          <p className={`text-xs mt-0.5 ${card.cardmarket!.avg1 >= card.cardmarket!.avg7 ? 'text-emerald-500' : 'text-red-400'}`}>
                            {formatPercent(card.cardmarket!.avg1, card.cardmarket!.avg7)}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-[#8b8fa6]">7-Day Avg</p>
                        <p className="text-sm font-semibold text-[var(--warm-200)]">{fmtPrice(eurToUSD(card.cardmarket!.avg7))}</p>
                        {card.cardmarket!.avg7 && card.cardmarket!.avg30 && (
                          <p className={`text-xs mt-0.5 ${card.cardmarket!.avg7 >= card.cardmarket!.avg30 ? 'text-emerald-500' : 'text-red-400'}`}>
                            {formatPercent(card.cardmarket!.avg7, card.cardmarket!.avg30)}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-[#8b8fa6]">30-Day Avg</p>
                        <p className="text-sm font-semibold text-[var(--warm-200)]">{fmtPrice(eurToUSD(card.cardmarket!.avg30))}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== Condition Prices ========== */}
            {card.conditionPrices && (
              <div className="bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#e8eaf0]">
                  <h2 className="text-lg font-bold text-[#1e2235]">Prices by Condition</h2>
                  <p className="text-xs text-[#8b8fa6] mt-0.5">TCGplayer prices across all conditions</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-[#8b8fa6] uppercase tracking-wider">
                        <th className="text-left px-5 py-3 font-medium">Condition</th>
                        <th className="text-right px-4 py-3 font-medium">Market</th>
                        <th className="text-right px-4 py-3 font-medium">Low</th>
                        <th className="text-right px-4 py-3 font-medium">Mid</th>
                        <th className="text-right px-5 py-3 font-medium">High</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Near Mint', data: card.conditionPrices.nearMint, color: 'text-emerald-500' },
                        { label: 'Lightly Played', data: card.conditionPrices.lightlyPlayed, color: 'text-lime-400' },
                        { label: 'Moderately Played', data: card.conditionPrices.moderatelyPlayed, color: 'text-yellow-400' },
                        { label: 'Heavily Played', data: card.conditionPrices.heavilyPlayed, color: 'text-orange-400' },
                        { label: 'Damaged', data: card.conditionPrices.damaged, color: 'text-red-400' },
                      ].map((row, i) => row.data ? (
                        <tr key={row.label} className={i % 2 === 0 ? 'bg-[#f5f6fa]/30' : ''}>
                          <td className="px-5 py-3 text-[var(--warm-200)] font-medium">
                            <span className={row.color}>&bull;</span> {row.label}
                          </td>
                          <td className={`text-right px-4 py-3 font-bold ${row.data.market ? row.color : 'text-[#b5b8c8]'}`}>
                            {fmtPrice(row.data.market)}
                          </td>
                          <td className="text-right px-4 py-3 text-[var(--warm-200)]">{fmtPrice(row.data.low)}</td>
                          <td className="text-right px-4 py-3 text-[var(--warm-200)]">{fmtPrice(row.data.mid)}</td>
                          <td className="text-right px-5 py-3 text-[var(--warm-200)]">{fmtPrice(row.data.high)}</td>
                        </tr>
                      ) : null)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========== Graded Prices ========== */}
            {card.gradedPrices && Object.keys(card.gradedPrices).length > 0 && (
              <div className="bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#e8eaf0]">
                  <h2 className="text-lg font-bold text-[#1e2235]">Graded Prices</h2>
                  <p className="text-xs text-[#8b8fa6] mt-0.5">PSA / BGS / CGC slab values</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-[#8b8fa6] uppercase tracking-wider">
                        <th className="text-left px-5 py-3 font-medium">Grade</th>
                        <th className="text-right px-4 py-3 font-medium">eBay 7d Avg</th>
                        <th className="text-right px-4 py-3 font-medium">eBay 30d Avg</th>
                        <th className="text-right px-5 py-3 font-medium">TCGplayer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(card.gradedPrices)
                        .sort(([a], [b]) => parseInt(b) - parseInt(a))
                        .map(([grade, data], i) => (
                          <tr key={grade} className={i % 2 === 0 ? 'bg-[#f5f6fa]/30' : ''}>
                            <td className="px-5 py-3">
                              <span className={`font-bold ${parseInt(grade) >= 9 ? 'text-[#6366f1]' : parseInt(grade) >= 7 ? 'text-[var(--warm-200)]' : 'text-[#8b8fa6]'}`}>
                                {grade}
                              </span>
                            </td>
                            <td className="text-right px-4 py-3 text-[var(--warm-200)]">{fmtPrice(data.ebay?.avg_7d)}</td>
                            <td className="text-right px-4 py-3 text-[var(--warm-200)]">{fmtPrice(data.ebay?.avg_30d)}</td>
                            <td className="text-right px-5 py-3 text-[var(--warm-200)]">{fmtPrice(data.tcgplayer?.market)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No prices */}
            {!hasPrices && !hasCardmarket && (
              <div className="bg-white border border-[#e8eaf0] rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3 opacity-50">📊</div>
                <p className="text-[#5c6078] font-medium">No price data available</p>
                <p className="text-[#8b8fa6] text-sm mt-1">This card doesn&apos;t have market prices yet</p>
              </div>
            )}

            {/* ========== Card Details ========== */}
            <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5">
              <h2 className="text-lg font-bold text-[#1e2235] mb-4">Card Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {card.set.series && (
                  <div>
                    <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">Series</p>
                    <p className="text-[var(--warm-200)] font-medium mt-0.5">{card.set.series}</p>
                  </div>
                )}
                {card.set.releaseDate && (
                  <div>
                    <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">Release Date</p>
                    <p className="text-[var(--warm-200)] font-medium mt-0.5">{new Date(card.set.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                )}
                {card.set.printedTotal && (
                  <div>
                    <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">Set Size</p>
                    <p className="text-[var(--warm-200)] font-medium mt-0.5">{card.number}/{card.set.printedTotal}</p>
                  </div>
                )}
                {card.artist && (
                  <div>
                    <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">Artist</p>
                    <p className="text-[var(--warm-200)] font-medium mt-0.5">{card.artist}</p>
                  </div>
                )}
                {card.nationalPokedexNumbers && card.nationalPokedexNumbers.length > 0 && (
                  <div>
                    <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">Pokedex #</p>
                    <p className="text-[var(--warm-200)] font-medium mt-0.5">{card.nationalPokedexNumbers.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Abilities */}
            {card.abilities && card.abilities.length > 0 && (
              <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5">
                <h2 className="text-lg font-bold text-[#1e2235] mb-3">Abilities</h2>
                {card.abilities.map((ability, i) => (
                  <div key={i} className="mb-3 last:mb-0">
                    <p className="text-sm font-semibold text-[#6366f1]">{ability.name}</p>
                    <p className="text-sm text-[#5c6078] mt-1 leading-relaxed">{ability.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Attacks */}
            {card.attacks && card.attacks.length > 0 && (
              <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5">
                <h2 className="text-lg font-bold text-[#1e2235] mb-3">Attacks</h2>
                <div className="space-y-3">
                  {card.attacks.map((attack, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-sm font-bold text-[#1e2235] whitespace-nowrap">
                        {attack.cost.join('')} {attack.damage}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--warm-200)]">{attack.name}</p>
                        {attack.text && <p className="text-xs text-[#8b8fa6] mt-0.5">{attack.text}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weakness / Resistance / Retreat */}
            {(card.weaknesses || card.resistances || card.retreatCost) && (
              <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {card.weaknesses && card.weaknesses.length > 0 && (
                    <div>
                      <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">Weakness</p>
                      {card.weaknesses.map((w, i) => (
                        <p key={i} className="text-[var(--warm-200)] font-medium mt-0.5">{w.type} {w.value}</p>
                      ))}
                    </div>
                  )}
                  {card.resistances && card.resistances.length > 0 && (
                    <div>
                      <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">Resistance</p>
                      {card.resistances.map((r, i) => (
                        <p key={i} className="text-[var(--warm-200)] font-medium mt-0.5">{r.type} {r.value}</p>
                      ))}
                    </div>
                  )}
                  {card.retreatCost && card.retreatCost.length > 0 && (
                    <div>
                      <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">Retreat Cost</p>
                      <p className="text-[var(--warm-200)] font-medium mt-0.5">{card.retreatCost.join(' ')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Flavor text */}
            {card.flavorText && (
              <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5">
                <p className="text-sm text-[#8b8fa6] italic leading-relaxed">&ldquo;{card.flavorText}&rdquo;</p>
              </div>
            )}

            {/* Legalities */}
            {card.legalities && Object.keys(card.legalities).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(card.legalities).map(([format, info]) => (
                  <span key={format} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    info.legal === 'Legal' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-500/15 text-red-400'
                  }`}>
                    {format}: {info.legal}
                  </span>
                ))}
              </div>
            )}
        {/* ========== Wishlist + Community Section ========== */}
        <div className="mt-8 space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => {
                if (!user) { window.location.href = '/login'; return }
                setWishlistLoading(true)
                await toggleWishlist(cardId, cardGame)
                setWishlistLoading(false)
              }}
              disabled={wishlistLoading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                wishlisted
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                  : 'bg-[#6366f1] text-[#1e2235] hover:bg-[#4f46e5] shadow-sm'
              }`}
            >
              {wishlisted ? '♥ In Wishlist' : '+ Add to Wishlist'}
            </button>
            <button
              onClick={() => {
                const section = document.getElementById('comments')
                section?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] text-[#5c6078] rounded-xl font-semibold text-sm hover:text-[#6366f1] hover:border-[#6366f1]/30 transition-all"
            >
              Comments ({comments.length})
            </button>
          </div>

          {/* Comments Section */}
          <div id="comments" className="bg-white border border-[#e8eaf0] rounded-2xl p-5">
            <h2 className="text-lg font-bold text-[#1e2235] mb-4">Community Discussion</h2>

            {/* Comment input */}
            {user ? (
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this card..."
                    maxLength={1000}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder:text-[#b5b8c8] focus:outline-none focus:border-amber-500/50 resize-none text-sm"
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-[#b5b8c8]">{newComment.length}/1000</span>
                    <button
                      onClick={async () => {
                        if (!newComment.trim()) return
                        await addComment(cardId, cardGame, newComment.trim())
                        setNewComment('')
                      }}
                      disabled={!newComment.trim()}
                      className="px-4 py-1.5 bg-[#6366f1] text-[#1e2235] rounded-lg text-xs font-semibold hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#f5f6fa] rounded-xl p-4 mb-4 text-center">
                <p className="text-sm text-[#8b8fa6]">Sign in to join the discussion</p>
                <a href="/login" className="inline-block mt-2 px-4 py-1.5 bg-[#6366f1] text-[#1e2235] rounded-lg text-xs font-semibold hover:bg-[#4f46e5] transition-all">Sign In</a>
              </div>
            )}

            {/* Comments list */}
            {commentsLoading ? (
              <div className="text-center py-6 text-[#8b8fa6] text-sm">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2 opacity-40">💬</div>
                <p className="text-[#8b8fa6] text-sm">No comments yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-[#f5f6fa] rounded-xl p-3.5">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-7 h-7 rounded-full bg-[#6366f1]/20 flex items-center justify-center text-xs font-bold text-[#6366f1]">
                        {comment.profiles?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <a href={`/u/${comment.profiles?.username || ''}`} className="text-sm font-semibold text-[#6366f1] hover:text-amber-300">
                          {comment.profiles?.username || 'Unknown'}
                        </a>
                        <span className="text-xs text-[#b5b8c8] ml-2">
                          {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-[#5c6078] leading-relaxed pl-9">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

          </div>
        </div>
      </div>
    </div>
  )
}