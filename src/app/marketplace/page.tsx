'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/useAuth'
import { useT } from '@/lib/i18n'

interface Listing {
  id: string
  seller_id: string
  game: string
  card_id: string
  card_name: string
  card_image: string | null
  condition: string
  graded_company: string | null
  graded_grade: string | null
  price: number
  currency: string
  quantity: number
  description: string | null
  created_at: string
  seller: {
    id: string
    username: string
    display_name: string
    seller_status: string
  }
}

const GAME_TABS = [
  { key: 'all', label: 'marketplace.allGames' },
  { key: 'pokemon', label: 'marketplace.pokemon' },
  { key: 'pokemon-jp', label: 'marketplace.pokemonJp' },
  { key: 'onepiece', label: 'marketplace.onePiece' },
]

const CONDITION_LABELS: Record<string, string> = {
  nm: 'marketplace.conditionNm',
  lp: 'marketplace.conditionLp',
  mp: 'marketplace.conditionMp',
  hp: 'marketplace.conditionHp',
  dmg: 'marketplace.conditionDmg',
  graded: 'marketplace.conditionGraded',
}

const SORT_OPTIONS = [
  { key: 'newest', label: 'marketplace.newest' },
  { key: 'price_low', label: 'marketplace.priceLow' },
  { key: 'price_high', label: 'marketplace.priceHigh' },
]

export default function MarketplacePage() {
  const { user } = useAuth()
  const t = useT()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [game, setGame] = useState('all')
  const [sort, setSort] = useState('newest')
  const [condition, setCondition] = useState('')
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 24

  useEffect(() => {
    fetchListings()
  }, [game, sort, condition, page])

  const fetchListings = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (game !== 'all') params.set('game', game)
    if (condition) params.set('condition', condition)
    params.set('sort', sort)
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (search) params.set('search', search)

    try {
      const headers: Record<string, string> = {}
      if (user) headers['Authorization'] = `Bearer ${user.access_token}`

      const res = await fetch(`/api/marketplace?${params}`, { headers })
      const data = await res.json()
      setListings(data.listings || [])
      setTotal(data.total || 0)
    } catch {
      setListings([])
    }
    setLoading(false)
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const getConditionBadge = (cond: string) => {
    const colors: Record<string, string> = {
      nm: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
      lp: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
      mp: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
      hp: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
      dmg: 'bg-red-500/15 text-red-500 border-red-500/30',
      graded: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
    }
    return colors[cond] || colors.nm
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e2235]">
              🛒 {t('marketplace.title')}
            </h1>
            <p className="text-xs sm:text-sm text-[#8b8fa6] mt-1">
              {t('marketplace.subtitle')}
            </p>
          </div>
          {user && (
            <div className="flex gap-2">
              <Link href="/marketplace/sell" className="px-4 py-2 text-xs font-semibold bg-[#6366f1] text-white rounded-xl hover:bg-[#4f46e5] transition-colors">
                + {t('marketplace.listForSale')}
              </Link>
              <Link href="/orders" className="px-4 py-2 text-xs font-semibold bg-white border border-[#e8eaf0] text-[#5c6078] rounded-xl hover:border-[#6366f1]/30 transition-colors">
                📋 {t('marketplace.myOrders')}
              </Link>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white border border-[#e8eaf0] rounded-2xl p-4 mb-6">
          {/* Game tabs */}
          <div className="flex gap-1 bg-[#f5f6fa] rounded-xl p-1 mb-3 overflow-x-auto no-scrollbar">
            {GAME_TABS.map(g => (
              <button
                key={g.key}
                onClick={() => { setGame(g.key); setPage(1) }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  game === g.key ? 'bg-[#6366f1] text-white shadow-sm' : 'text-[#5c6078] hover:text-[#1e2235] hover:bg-white/50'
                }`}
              >
                {t(g.label as any)}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchListings()}
                placeholder={t('marketplace.searchPlaceholder')}
                className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-sm text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none"
              />
            </div>

            {/* Condition filter */}
            <select
              value={condition}
              onChange={e => { setCondition(e.target.value); setPage(1) }}
              className="px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-sm text-[#1e2235] focus:border-[#6366f1] focus:outline-none"
            >
              <option value="">{t('marketplace.allConditions')}</option>
              {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{t(label as any)}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-sm text-[#1e2235] focus:border-[#6366f1] focus:outline-none"
            >
              {SORT_OPTIONS.map(s => (
                <option key={s.key} value={s.key}>{t(s.label as any)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shimmer h-64 rounded-2xl" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
            <div className="text-5xl mb-3 opacity-50">🛒</div>
            <h2 className="text-lg font-bold text-[#1e2235] mb-1">{t('marketplace.noListings')}</h2>
            <p className="text-sm text-[#8b8fa6]">{t('marketplace.noListingsDesc')}</p>
            {user && (
              <Link href="/marketplace/sell" className="inline-block mt-4 px-5 py-2 bg-[#6366f1] text-white rounded-xl text-sm font-bold hover:bg-[#4f46e5]">
                {t('marketplace.beFirstSeller')}
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#8b8fa6]">
                {total} {t('marketplace.showingResults')}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {listings.map(listing => (
                <Link
                  key={listing.id}
                  href={`/marketplace/${listing.id}`}
                  className="bg-white border border-transparent hover:border-[#6366f1]/20 rounded-2xl overflow-hidden transition-all hover:shadow-md group"
                >
                  {/* Image */}
                  <div className="aspect-[3/4] bg-[#f5f6fa] relative overflow-hidden">
                    {listing.card_image ? (
                      <img
                        src={listing.card_image}
                        alt={listing.card_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🃏</div>
                    )}
                    {/* Condition badge */}
                    <span className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-lg font-semibold border ${getConditionBadge(listing.condition)}`}>
                      {listing.condition === 'graded' && listing.graded_grade
                        ? `${listing.graded_company} ${listing.graded_grade}`
                        : t((CONDITION_LABELS[listing.condition] || CONDITION_LABELS.nm) as any)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-[#1e2235] line-clamp-2 mb-1 leading-tight">{listing.card_name}</h3>
                    <p className="text-xs text-[#8b8fa6] mb-2">@{listing.seller.username}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-extrabold text-[#6366f1]">{formatPrice(listing.price, listing.currency)}</span>
                      {listing.quantity > 1 && (
                        <span className="text-[10px] text-[#8b8fa6]">×{listing.quantity}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: Math.ceil(total / limit) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      page === i + 1 ? 'bg-[#6366f1] text-white' : 'bg-white border border-[#e8eaf0] text-[#5c6078] hover:border-[#6366f1]/30'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}