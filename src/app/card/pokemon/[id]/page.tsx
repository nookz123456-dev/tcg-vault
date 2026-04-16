'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

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
  // Graded prices from TCG Price Lookup API
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

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '—'
  return `$${price.toFixed(2)}`
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
              // Find best match (same set name)
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
          .catch(() => {}) // Non-critical, don't block UI
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen">
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
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4 opacity-50">😕</div>
          <p className="text-gray-300 text-lg">Card not found</p>
          <button onClick={() => router.back()} className="mt-4 text-amber-400 hover:text-amber-300 text-sm font-medium">
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  const hasPrices = card.priceBreakdown.length > 0
  const hasCardmarket = card.cardmarket && card.cardmarket.trendPrice

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-1.5 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back to search
        </button>

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
                <span className="px-2.5 py-0.5 bg-yellow-500/15 text-yellow-400 rounded-lg text-xs font-medium">
                  Pokemon
                </span>
                {card.supertype && (
                  <span className="px-2.5 py-0.5 bg-gray-700/50 text-gray-300 rounded-lg text-xs font-medium">
                    {card.supertype}
                  </span>
                )}
                {card.rarity && (
                  <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-400 rounded-lg text-xs font-medium">
                    {card.rarity}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white">{card.name}</h1>
              <p className="text-gray-400 mt-1">
                {card.set.name} · #{card.number}
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3">
              {card.hp && (
                <span className="px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-sm font-medium">
                  ❤️ HP {card.hp}
                </span>
              )}
              {card.types?.map(t => (
                <span key={t} className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white ${TYPE_COLORS[t] || 'bg-gray-600'}`}>
                  {t}
                </span>
              ))}
              {card.evolveFrom && (
                <span className="px-3 py-1.5 bg-blue-500/15 text-blue-400 rounded-lg text-sm font-medium">
                  Evolves from {card.evolveFrom}
                </span>
              )}
            </div>

            {/* ========== PRICE BREAKDOWN — Like PriceCharting ========== */}
            {hasPrices && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">Price Guide</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      TCGplayer market prices
                      {card.tcgplayer.updatedAt && (
                        <> · Updated {new Date(card.tcgplayer.updatedAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                  {card.tcgplayer.url && (
                    <a
                      href={card.tcgplayer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                    >
                      View on TCGplayer →
                    </a>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase tracking-wider">
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
                        <tr key={variant.key} className={i % 2 === 0 ? 'bg-[var(--surface-1)]/30' : ''}>
                          <td className="px-5 py-3 text-gray-200 font-medium">{variant.label}</td>
                          <td className="text-right px-4 py-3 text-amber-400 font-bold">
                            {formatPrice(variant.prices.market)}
                          </td>
                          <td className="text-right px-4 py-3 text-gray-300">
                            {formatPrice(variant.prices.low)}
                          </td>
                          <td className="text-right px-4 py-3 text-gray-300">
                            {formatPrice(variant.prices.mid)}
                          </td>
                          <td className="text-right px-4 py-3 text-gray-300">
                            {formatPrice(variant.prices.high)}
                          </td>
                          <td className="text-right px-5 py-3 text-gray-400">
                            {formatPrice(variant.prices.directLow)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========== CardMarket Price Trend ========== */}
            {hasCardmarket && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">CardMarket Trend</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      European market · {card.cardmarketUpdatedAt ? new Date(card.cardmarketUpdatedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {card.cardmarketUrl && (
                    <a
                      href={card.cardmarketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                    >
                      View on CardMarket →
                    </a>
                  )}
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Trend price - highlighted */}
                    <div className="col-span-2 md:col-span-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                      <p className="text-xs text-amber-400/70 font-medium uppercase tracking-wider">Trend Price</p>
                      <p className="text-2xl font-bold text-amber-400 mt-1">
                        €{card.cardmarket!.trendPrice!.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Avg Sell Price</p>
                      <p className="text-lg font-semibold text-gray-200 mt-1">
                        €{card.cardmarket!.averageSellPrice?.toFixed(2) ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Suggested Price</p>
                      <p className="text-lg font-semibold text-gray-200 mt-1">
                        €{card.cardmarket!.suggestedPrice?.toFixed(2) ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Low Price</p>
                      <p className="text-lg font-semibold text-gray-200 mt-1">
                        €{card.cardmarket!.lowPrice?.toFixed(2) ?? '—'}
                      </p>
                    </div>
                  </div>

                  {/* Price averages */}
                  <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
                    <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">Price Averages</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">1-Day Avg</p>
                        <p className="text-sm font-semibold text-gray-200">€{card.cardmarket!.avg1?.toFixed(2) ?? '—'}</p>
                        {card.cardmarket!.avg1 && card.cardmarket!.avg7 && (
                          <p className={`text-xs mt-0.5 ${card.cardmarket!.avg1 >= card.cardmarket!.avg7 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatPercent(card.cardmarket!.avg1, card.cardmarket!.avg7)}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">7-Day Avg</p>
                        <p className="text-sm font-semibold text-gray-200">€{card.cardmarket!.avg7?.toFixed(2) ?? '—'}</p>
                        {card.cardmarket!.avg7 && card.cardmarket!.avg30 && (
                          <p className={`text-xs mt-0.5 ${card.cardmarket!.avg7 >= card.cardmarket!.avg30 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatPercent(card.cardmarket!.avg7, card.cardmarket!.avg30)}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">30-Day Avg</p>
                        <p className="text-sm font-semibold text-gray-200">€{card.cardmarket!.avg30?.toFixed(2) ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== Condition Prices — Like PriceCharting ========== */}
            {card.conditionPrices && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--card-border)]">
                  <h2 className="text-lg font-bold text-white">Prices by Condition</h2>
                  <p className="text-xs text-gray-500 mt-0.5">TCGplayer prices across all conditions</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase tracking-wider">
                        <th className="text-left px-5 py-3 font-medium">Condition</th>
                        <th className="text-right px-4 py-3 font-medium">Market</th>
                        <th className="text-right px-4 py-3 font-medium">Low</th>
                        <th className="text-right px-4 py-3 font-medium">Mid</th>
                        <th className="text-right px-5 py-3 font-medium">High</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Near Mint', data: card.conditionPrices.nearMint, color: 'text-emerald-400' },
                        { label: 'Lightly Played', data: card.conditionPrices.lightlyPlayed, color: 'text-lime-400' },
                        { label: 'Moderately Played', data: card.conditionPrices.moderatelyPlayed, color: 'text-yellow-400' },
                        { label: 'Heavily Played', data: card.conditionPrices.heavilyPlayed, color: 'text-orange-400' },
                        { label: 'Damaged', data: card.conditionPrices.damaged, color: 'text-red-400' },
                      ].map((row, i) => row.data ? (
                        <tr key={row.label} className={i % 2 === 0 ? 'bg-[var(--surface-1)]/30' : ''}>
                          <td className="px-5 py-3 text-gray-200 font-medium">
                            <span className={row.color}>●</span> {row.label}
                          </td>
                          <td className={`text-right px-4 py-3 font-bold ${row.data.market ? row.color : 'text-gray-500'}`}>
                            {formatPrice(row.data.market)}
                          </td>
                          <td className="text-right px-4 py-3 text-gray-300">{formatPrice(row.data.low)}</td>
                          <td className="text-right px-4 py-3 text-gray-300">{formatPrice(row.data.mid)}</td>
                          <td className="text-right px-5 py-3 text-gray-300">{formatPrice(row.data.high)}</td>
                        </tr>
                      ) : null)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========== Graded Prices — PSA / BGS / CGC ========== */}
            {card.gradedPrices && Object.keys(card.gradedPrices).length > 0 && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--card-border)]">
                  <h2 className="text-lg font-bold text-white">Graded Prices</h2>
                  <p className="text-xs text-gray-500 mt-0.5">PSA / BGS / CGC slab values</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase tracking-wider">
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
                          <tr key={grade} className={i % 2 === 0 ? 'bg-[var(--surface-1)]/30' : ''}>
                            <td className="px-5 py-3">
                              <span className={`font-bold ${parseInt(grade) >= 9 ? 'text-amber-400' : parseInt(grade) >= 7 ? 'text-gray-200' : 'text-gray-400'}`}>
                                {grade}
                              </span>
                            </td>
                            <td className="text-right px-4 py-3 text-gray-300">
                              {data.ebay?.avg_7d ? `$${data.ebay.avg_7d.toFixed(2)}` : '—'}
                            </td>
                            <td className="text-right px-4 py-3 text-gray-300">
                              {data.ebay?.avg_30d ? `$${data.ebay.avg_30d.toFixed(2)}` : '—'}
                            </td>
                            <td className="text-right px-5 py-3 text-gray-300">
                              {data.tcgplayer?.market ? `$${data.tcgplayer.market.toFixed(2)}` : '—'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No prices message */}
            {!hasPrices && !hasCardmarket && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3 opacity-50">📊</div>
                <p className="text-gray-300 font-medium">No price data available</p>
                <p className="text-gray-500 text-sm mt-1">This card doesn't have market prices yet</p>
              </div>
            )}

            {/* ========== Card Details ========== */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
              <h2 className="text-lg font-bold text-white mb-4">Card Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {card.set.series && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Series</p>
                    <p className="text-gray-200 font-medium mt-0.5">{card.set.series}</p>
                  </div>
                )}
                {card.set.releaseDate && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Release Date</p>
                    <p className="text-gray-200 font-medium mt-0.5">{new Date(card.set.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                )}
                {card.set.printedTotal && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Set Size</p>
                    <p className="text-gray-200 font-medium mt-0.5">{card.number}/{card.set.printedTotal}</p>
                  </div>
                )}
                {card.artist && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Artist</p>
                    <p className="text-gray-200 font-medium mt-0.5">{card.artist}</p>
                  </div>
                )}
                {card.nationalPokedexNumbers && card.nationalPokedexNumbers.length > 0 && (
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider">Pokedex #</p>
                    <p className="text-gray-200 font-medium mt-0.5">{card.nationalPokedexNumbers.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Abilities */}
            {card.abilities && card.abilities.length > 0 && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
                <h2 className="text-lg font-bold text-white mb-3">Abilities</h2>
                {card.abilities.map((ability, i) => (
                  <div key={i} className="mb-3 last:mb-0">
                    <p className="text-sm font-semibold text-amber-400">{ability.name}</p>
                    <p className="text-sm text-gray-300 mt-1 leading-relaxed">{ability.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Attacks */}
            {card.attacks && card.attacks.length > 0 && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
                <h2 className="text-lg font-bold text-white mb-3">Attacks</h2>
                <div className="space-y-3">
                  {card.attacks.map((attack, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-sm font-bold text-white whitespace-nowrap">
                        {attack.cost.join('')} {attack.damage}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-200">{attack.name}</p>
                        {attack.text && <p className="text-xs text-gray-400 mt-0.5">{attack.text}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weakness / Resistance / Retreat */}
            {(card.weaknesses || card.resistances || card.retreatCost) && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {card.weaknesses && card.weaknesses.length > 0 && (
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Weakness</p>
                      {card.weaknesses.map((w, i) => (
                        <p key={i} className="text-gray-200 font-medium mt-0.5">{w.type} {w.value}</p>
                      ))}
                    </div>
                  )}
                  {card.resistances && card.resistances.length > 0 && (
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Resistance</p>
                      {card.resistances.map((r, i) => (
                        <p key={i} className="text-gray-200 font-medium mt-0.5">{r.type} {r.value}</p>
                      ))}
                    </div>
                  )}
                  {card.retreatCost && card.retreatCost.length > 0 && (
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wider">Retreat Cost</p>
                      <p className="text-gray-200 font-medium mt-0.5">{card.retreatCost.join(' ')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Flavor text */}
            {card.flavorText && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
                <p className="text-sm text-gray-400 italic leading-relaxed">&ldquo;{card.flavorText}&rdquo;</p>
              </div>
            )}

            {/* Legalities */}
            {card.legalities && Object.keys(card.legalities).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(card.legalities).map(([format, info]) => (
                  <span key={format} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    info.legal === 'Legal' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                  }`}>
                    {format}: {info.legal}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}