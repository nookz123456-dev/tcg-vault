'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { useWishlist } from '@/lib/useWishlist'
import { useComments } from '@/lib/useComments'
import { useAuth } from '@/lib/useAuth'
import PriceHistoryChart from '@/components/PriceHistoryChart'

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

const CONDITION_CONFIG = [
  { key: 'nearMint', label: 'Near Mint', color: '#10b981' },
  { key: 'lightlyPlayed', label: 'Lightly Played', color: '#84cc16' },
  { key: 'moderatelyPlayed', label: 'Moderately Played', color: '#eab308' },
  { key: 'heavilyPlayed', label: 'Heavily Played', color: '#f97316' },
  { key: 'damaged', label: 'Damaged', color: '#ef4444' },
] as const

export default function OnePieceCardPage() {
  const params = useParams()
  const router = useRouter()
  const cardName = decodeURIComponent(params.id as string)
  const [card, setCard] = useState<CardPriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [showTHB, setShowTHB] = useState(false)
  const { formatUSD, formatTHB, toTHB } = useExchangeRates()
  const { user } = useAuth()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { comments, loading: commentsLoading, fetchComments, addComment } = useComments()
  const [newComment, setNewComment] = useState('')
  const [wishlistLoading, setWishlistLoading] = useState(false)

  const cardId = cardName
  const cardGame = 'onepiece'
  const wishlisted = isInWishlist(cardId, cardGame)

  useEffect(() => {
    fetchComments(cardId, cardGame)
  }, [cardId, cardGame, fetchComments])

  useEffect(() => {
    fetch(`/api/cards/onepiece/${encodeURIComponent(cardName)}`)
      .then(r => r.json())
      .then(data => {
        setCard(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [cardName])

  const fmtPrice = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || amount === 0) return '\u2014'
    if (showTHB) return formatTHB(toTHB(amount))
    return formatUSD(amount)
  }

  const getConditionData = (key: string) => {
    if (!card?.prices) return null
    return card.prices[key as keyof typeof card.prices] || null
  }

  const hasAnyConditionPrices = () => {
    if (!card?.prices) return false
    return CONDITION_CONFIG.some(c => getConditionData(c.key) !== null)
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#f5f6fa' }}>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="w-[320px] h-[448px] bg-gray-200 rounded-xl animate-pulse" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="min-h-screen" style={{ background: '#f5f6fa' }}>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-[#5c6078] text-lg font-medium">Card not found</p>
          <button onClick={() => router.back()} className="mt-4 text-[#6366f1] hover:text-[#4f46e5] text-sm font-medium">
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  const hasGraded = card.graded && Object.keys(card.graded).length > 0

  return (
    <div className="min-h-screen" style={{ background: '#f5f6fa', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button + Currency toggle */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="text-[#8b8fa6] hover:text-[#1e2235] text-sm flex items-center gap-1.5 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            Back to search
          </button>
          <button
            onClick={() => setShowTHB(!showTHB)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e8eaf0] rounded-lg text-xs font-semibold transition-all hover:border-[#6366f1]/30 shadow-sm"
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
                {!imgLoaded && <div className="w-[320px] h-[447px] bg-gray-200 rounded-xl animate-pulse" />}
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className={`w-full rounded-xl shadow-lg transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.12)' }}
                    onLoad={() => setImgLoaded(true)}
                  />
                ) : (
                  <div className="w-full aspect-[2.5/3.5] bg-[#f5f6fa] rounded-xl flex items-center justify-center text-[#b5b8c8]">No Image</div>
                )}
              </div>
            </div>
          </div>

          {/* Card info */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-semibold">One Piece</span>
                {card.rarity && (
                  <span className="px-3 py-1 bg-white border border-[#e8eaf0] text-[#5c6078] rounded-lg text-xs font-medium">
                    {card.rarity}
                  </span>
                )}
                {card.variant && (
                  <span className="px-3 py-1 bg-white border border-[#e8eaf0] text-[#8b8fa6] rounded-lg text-xs font-medium">
                    {card.variant}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-[#1e2235] mb-2">{card.name}</h1>
              <p className="text-[#5c6078] text-sm">{card.setName} &middot; #{card.number}</p>
            </div>

            {/* ========== CONDITION PRICES TABLE ========== */}
            {hasAnyConditionPrices() && (
              <div className="bg-white border border-[#e8eaf0] rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-[#e8eaf0] bg-gray-50/50">
                  <h2 className="text-base font-semibold text-[#1e2235]">Price by Condition</h2>
                  <p className="text-xs text-[#8b8fa6] mt-0.5">TCGplayer market prices</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">Condition</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-[#6366f1] uppercase tracking-wider">Market</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">Low</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">Mid</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">High</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CONDITION_CONFIG.map((condition, i) => {
                        const data = getConditionData(condition.key)
                        if (!data) return null
                        return (
                          <tr key={condition.key} className="border-t border-[#e8eaf0] hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: condition.color }} />
                                <span className="text-[#1e2235] font-medium">{condition.label}</span>
                              </div>
                            </td>
                            <td className="text-right px-4 py-3.5">
                              <span className="text-[#6366f1] font-bold text-base">{fmtPrice(data.market)}</span>
                            </td>
                            <td className="text-right px-4 py-3.5 text-[#5c6078]">{fmtPrice(data.low)}</td>
                            <td className="text-right px-4 py-3.5 text-[#5c6078]">{fmtPrice(data.mid)}</td>
                            <td className="text-right px-5 py-3.5 text-[#5c6078]">{fmtPrice(data.high)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {card.tcgplayerId && (
                  <div className="px-5 py-3 border-t border-[#e8eaf0] bg-gray-50/30">
                    <a
                      href={`https://www.tcgplayer.com/product/${card.tcgplayerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#6366f1] hover:text-[#4f46e5] font-medium flex items-center gap-1"
                    >
                      View on TCGplayer →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* ========== GRADED PRICES TABLE ========== */}
            {hasGraded && (
              <div className="bg-white border border-[#e8eaf0] rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-[#e8eaf0] bg-gray-50/50">
                  <h2 className="text-base font-semibold text-[#1e2235]">Graded Prices</h2>
                  <p className="text-xs text-[#8b8fa6] mt-0.5">PSA, CGC, BGS slab values</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">Grade</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">eBay 7d Avg</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">eBay 30d Avg</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-[#6366f1] uppercase tracking-wider">TCGplayer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(card.graded!)
                        .sort(([a], [b]) => parseInt(b) - parseInt(a))
                        .map(([grade, data], i) => {
                          const isHighGrade = parseInt(grade) >= 9
                          return (
                            <tr key={grade} className="border-t border-[#e8eaf0] hover:bg-gray-50/50 transition-colors">
                              <td className="px-5 py-3.5">
                                <span className={`font-semibold ${isHighGrade ? 'text-[#6366f1]' : 'text-[#1e2235]'}`}>
                                  {grade}
                                </span>
                              </td>
                              <td className="text-right px-4 py-3.5 text-[#5c6078]">{fmtPrice(data.ebay?.avg_7d)}</td>
                              <td className="text-right px-4 py-3.5 text-[#5c6078]">{fmtPrice(data.ebay?.avg_30d)}</td>
                              <td className="text-right px-5 py-3.5">
                                <span className={`font-bold ${isHighGrade ? 'text-[#6366f1]' : 'text-[#1e2235]'}`}>
                                  {fmtPrice(data.tcgplayer?.market)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Price History Chart */}
            <PriceHistoryChart cardId={cardId} game="onepiece" height={280} />

            {/* No prices message */}
            {!hasAnyConditionPrices() && !hasGraded && (
              <div className="bg-white border border-[#e8eaf0] rounded-xl p-8 text-center shadow-sm">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-[#5c6078] font-medium">No price data available</p>
                <p className="text-[#8b8fa6] text-sm mt-1">This card doesn&apos;t have market prices yet</p>
              </div>
            )}

            {/* ========== WISHLIST + COMMUNITY ========== */}
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
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                    : 'bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-sm'
                }`}
              >
                {wishlisted ? '♥ In Wishlist' : '+ Add to Wishlist'}
              </button>
              <button
                onClick={() => {
                  const section = document.getElementById('comments')
                  section?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e8eaf0] text-[#5c6078] rounded-xl font-semibold text-sm hover:text-[#6366f1] hover:border-[#6366f1]/30 transition-all shadow-sm"
              >
                Comments ({comments.length})
              </button>
            </div>

            {/* Comments Section */}
            <div id="comments" className="bg-white border border-[#e8eaf0] rounded-xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-[#1e2235] mb-4">Community Discussion</h2>

              {user ? (
                <div className="mb-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts about this card..."
                    maxLength={1000}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder:text-[#b5b8c8] focus:outline-none focus:border-[#6366f1]/50 resize-none text-sm transition-colors"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-[#b5b8c8]">{newComment.length}/1000</span>
                    <button
                      onClick={async () => {
                        if (!newComment.trim()) return
                        await addComment(cardId, cardGame, newComment.trim())
                        setNewComment('')
                      }}
                      disabled={!newComment.trim()}
                      className="px-5 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#f5f6fa] rounded-xl p-4 mb-4 text-center">
                  <p className="text-sm text-[#8b8fa6]">Sign in to join the discussion</p>
                  <a href="/login" className="inline-block mt-2 px-5 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] transition-all">
                    Sign In
                  </a>
                </div>
              )}

              {commentsLoading ? (
                <div className="text-center py-6 text-[#8b8fa6] text-sm">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2 opacity-40">💬</div>
                  <p className="text-[#8b8fa6] text-sm">No comments yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-[#f5f6fa] rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-sm font-bold text-rose-500">
                          {comment.profiles?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <a href={`/u/${comment.profiles?.username || ''}`} className="text-sm font-semibold text-[#6366f1] hover:text-[#4f46e5]">
                            {comment.profiles?.username || 'Unknown'}
                          </a>
                          <span className="text-xs text-[#b5b8c8] ml-2">
                            {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-[#5c6078] leading-relaxed pl-11">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}