'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useExchangeRates } from '@/lib/useExchangeRates'

interface PriceCondition {
  market: number | null
  low: number | null
  mid: number | null
  high: number | null
}

interface CardPriceData {
  id: string
  tcgplayerId?: string | null
  name: string
  number: string
  rarity: string | null
  variant: string | null
  imageUrl: string | null
  setName: string
  setSlug: string
  game: string
  prices: {
    nearMint: PriceCondition | null
    lightlyPlayed: PriceCondition | null
    moderatelyPlayed: PriceCondition | null
    heavilyPlayed: PriceCondition | null
    damaged: PriceCondition | null
  }
  graded: Record<string, {
    ebay?: { avg_7d: number | null; avg_30d: number | null }
    tcgplayer?: { market: number | null }
  }> | null
  lastPriceUpdate: string | null
}

export default function PokemonJPCardPage() {
  const params = useParams()
  const router = useRouter()
  const cardName = decodeURIComponent(params.id as string)
  const [card, setCard] = useState<CardPriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTHB, setShowTHB] = useState(false)
  const { formatUSD, formatTHB, toTHB } = useExchangeRates()

  useEffect(() => {
    fetch(`/api/cards/pokemon-jp/${encodeURIComponent(cardName)}`)
      .then(r => r.json())
      .then(data => {
        setCard(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [cardName])

  const fmtPrice = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || amount === 0) return '—'
    if (showTHB) return formatTHB(toTHB(amount))
    return formatUSD(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[var(--warm-400)] mt-4 text-sm">Loading card details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-5xl mb-4">🤷</div>
            <p className="text-[var(--warm-300)] font-medium">Card not found</p>
            <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-[var(--surface-1)] text-[var(--warm-300)] rounded-xl hover:text-amber-400 transition-colors">Go Back</button>
          </div>
        </div>
      </div>
    )
  }

  const hasPrices = card.prices.nearMint?.market || card.prices.lightlyPlayed?.market ||
    card.prices.moderatelyPlayed?.market || card.prices.heavilyPlayed?.market || card.prices.damaged?.market
  const hasGraded = card.graded && Object.keys(card.graded).length > 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back button + Currency toggle */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[var(--warm-400)] hover:text-amber-400 transition-colors text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            Back to search
          </button>
          <button
            onClick={() => setShowTHB(!showTHB)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-1)] border border-[var(--card-border)] rounded-lg text-xs font-semibold transition-all hover:border-amber-500/30"
          >
            <span className={showTHB ? 'text-[var(--warm-400)]' : 'text-amber-400'}>$ USD</span>
            <span className="text-[var(--warm-500)]">/</span>
            <span className={showTHB ? 'text-amber-400' : 'text-[var(--warm-400)]'}>฿ THB</span>
          </button>
        </div>

        <div className="grid md:grid-cols-[320px_1fr] gap-8">
          {/* Card Image */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 flex items-center justify-center">
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className="w-full max-w-[280px] rounded-xl" />
            ) : (
              <div className="w-full aspect-[2.5/3.5] bg-[var(--surface-1)] rounded-xl flex items-center justify-center text-[var(--warm-500)]">No Image</div>
            )}
          </div>

          {/* Card Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-yellow-500/15 text-yellow-400 rounded-lg text-xs font-bold uppercase tracking-wider">Pokemon JP</span>
                {card.rarity && <span className="px-3 py-1 bg-amber-500/15 text-amber-400 rounded-lg text-xs font-bold">{card.rarity}</span>}
                {card.variant && <span className="px-3 py-1 bg-purple-500/15 text-purple-400 rounded-lg text-xs font-medium">{card.variant}</span>}
              </div>
              <h1 className="text-3xl font-extrabold text-[var(--foreground)]">{card.name}</h1>
              <p className="text-[var(--warm-400)] mt-1">{card.setName} &middot; #{card.number}</p>
            </div>

            {/* No prices */}
            {!hasPrices && !hasGraded && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3 opacity-50">📊</div>
                <p className="text-[var(--warm-300)] font-medium">No price data available</p>
                <p className="text-[var(--warm-400)] text-sm mt-1">This card doesn&apos;t have market prices yet</p>
              </div>
            )}

            {/* Condition Prices */}
            {hasPrices && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--card-border)]">
                  <h2 className="text-lg font-bold text-[var(--foreground)]">Price Guide</h2>
                  <p className="text-xs text-[var(--warm-400)] mt-0.5">TCGplayer market prices by condition</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-[var(--warm-400)] uppercase tracking-wider">
                        <th className="text-left px-5 py-3 font-medium">Condition</th>
                        <th className="text-right px-4 py-3 font-medium">Market</th>
                        <th className="text-right px-4 py-3 font-medium">Low</th>
                        <th className="text-right px-4 py-3 font-medium">Mid</th>
                        <th className="text-right px-5 py-3 font-medium">High</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Near Mint', data: card.prices.nearMint, color: 'text-emerald-400' },
                        { label: 'Lightly Played', data: card.prices.lightlyPlayed, color: 'text-lime-400' },
                        { label: 'Moderately Played', data: card.prices.moderatelyPlayed, color: 'text-yellow-400' },
                        { label: 'Heavily Played', data: card.prices.heavilyPlayed, color: 'text-orange-400' },
                        { label: 'Damaged', data: card.prices.damaged, color: 'text-red-400' },
                      ].map((row, i) => row.data ? (
                        <tr key={row.label} className={i % 2 === 0 ? 'bg-[var(--surface-1)]/30' : ''}>
                          <td className="px-5 py-3 text-[var(--warm-200)] font-medium">
                            <span className={row.color}>&bull;</span> {row.label}
                          </td>
                          <td className={`text-right px-4 py-3 font-bold ${row.data.market ? row.color : 'text-[var(--warm-500)]'}`}>
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
                {card.lastPriceUpdate && (
                  <div className="px-5 py-3 border-t border-[var(--card-border)] text-xs text-[var(--warm-400)]">
                    Last updated: {new Date(card.lastPriceUpdate).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {/* Graded Prices */}
            {hasGraded && (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--card-border)]">
                  <h2 className="text-lg font-bold text-[var(--foreground)]">Graded Prices</h2>
                  <p className="text-xs text-[var(--warm-400)] mt-0.5">PSA / BGS / CGC slab values</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-[var(--warm-400)] uppercase tracking-wider">
                        <th className="text-left px-5 py-3 font-medium">Grade</th>
                        <th className="text-right px-4 py-3 font-medium">eBay 7d Avg</th>
                        <th className="text-right px-4 py-3 font-medium">eBay 30d Avg</th>
                        <th className="text-right px-5 py-3 font-medium">TCGplayer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(card.graded!)
                        .sort(([a], [b]) => parseInt(b) - parseInt(a))
                        .map(([grade, data], i) => (
                          <tr key={grade} className={i % 2 === 0 ? 'bg-[var(--surface-1)]/30' : ''}>
                            <td className="px-5 py-3">
                              <span className={`font-bold ${parseInt(grade) >= 9 ? 'text-amber-400' : parseInt(grade) >= 7 ? 'text-[var(--warm-200)]' : 'text-[var(--warm-400)]'}`}>
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

            {/* TCGplayer link */}
            {card.tcgplayerId && (
              <a
                href={`https://www.tcgplayer.com/product/${card.tcgplayerId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors font-medium text-sm"
              >
                View on TCGplayer &rarr;
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}