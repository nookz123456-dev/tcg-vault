'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  images: string[]
  views: number
  created_at: string
  seller: {
    id: string
    username: string
    display_name: string
    seller_status: string
  }
}

const CONDITION_LABELS: Record<string, string> = {
  nm: 'marketplace.nearMint',
  lp: 'marketplace.lightlyPlayed',
  mp: 'marketplace.moderatelyPlayed',
  hp: 'marketplace.heavilyPlayed',
  dmg: 'marketplace.damaged',
  graded: 'marketplace.graded',
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const t = useT()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [showBuyConfirm, setShowBuyConfirm] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)

  useEffect(() => {
    fetchListing()
  }, [params.id])

  const fetchListing = async () => {
    try {
      const headers: Record<string, string> = {}
      if (user) headers['Authorization'] = `Bearer ${user.access_token}`

      const res = await fetch(`/api/marketplace?card_id=${params.id}`, { headers })
      const data = await res.json()
      const found = (data.listings || []).find((l: Listing) => l.id === params.id)
      setListing(found || null)
    } catch {
      setListing(null)
    }
    setLoading(false)
  }

  const handleBuy = async () => {
    if (!user || !listing) return
    setBuying(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({
          buyer_id: user.id,
          seller_id: listing.seller_id,
          listing_id: listing.id,
          price: listing.price,
          currency: listing.currency,
          quantity,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setOrderPlaced(true)
        setShowBuyConfirm(false)
      }
    } catch {}
    setBuying(false)
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="shimmer h-8 w-48 rounded-lg mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="shimmer h-96 rounded-2xl" />
            <div className="space-y-4">
              <div className="shimmer h-6 w-3/4 rounded-lg" />
              <div className="shimmer h-4 w-1/2 rounded-lg" />
              <div className="shimmer h-10 w-1/3 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-[#1e2235] mb-2">{t('marketplace.listingNotFound')}</h2>
          <p className="text-[#8b8fa6]">{t('marketplace.listingRemoved')}</p>
          <Link href="/marketplace" className="inline-block mt-4 px-5 py-2 bg-[#6366f1] text-white rounded-xl text-sm font-bold hover:bg-[#4f46e5]">
            ← {t('marketplace.backToMarketplace')}
          </Link>
        </div>
      </div>
    )
  }

  const isOwnListing = user && user.id === listing.seller_id

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#8b8fa6] mb-4">
          <Link href="/marketplace" className="hover:text-[#6366f1]">{t('marketplace.title')}</Link>
          <span>/</span>
          <span className="text-[#1e2235] truncate">{listing.card_name}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Image */}
          <div className="bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden">
            <div className="aspect-[3/4] bg-[#f5f6fa] flex items-center justify-center">
              {listing.card_image ? (
                <img src={listing.card_image} alt={listing.card_name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-6xl opacity-30">🃏</div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-lg font-semibold bg-[#6366f1]/10 text-[#6366f1]">{listing.game}</span>
                <span className="text-xs px-2 py-0.5 rounded-lg font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                  {listing.condition === 'graded' ? `${listing.graded_company} ${listing.graded_grade}` : t((CONDITION_LABELS[listing.condition] || CONDITION_LABELS.nm) as any)}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e2235]">{listing.card_name}</h1>
            </div>

            {/* Price */}
            <div className="bg-[#f5f6fa] rounded-xl p-4">
              <p className="text-xs text-[#8b8fa6] mb-1">{t('marketplace.price')}</p>
              <p className="text-2xl font-extrabold text-[#6366f1]">{formatPrice(listing.price, listing.currency)}</p>
              {listing.quantity > 1 && (
                <p className="text-xs text-[#8b8fa6] mt-1">{t('marketplace.available')}: {listing.quantity}</p>
              )}
            </div>

            {/* Seller */}
            <div className="bg-white border border-[#e8eaf0] rounded-xl p-4">
              <p className="text-xs text-[#8b8fa6] mb-2">{t('marketplace.soldBy')}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#6366f1]/10 flex items-center justify-center text-sm font-bold text-[#6366f1]">
                  {(listing.seller.display_name || listing.seller.username).charAt(0).toUpperCase()}
                </div>
                <div>
                  <Link href={`/u/${listing.seller.username}`} className="text-sm font-semibold text-[#1e2235] hover:text-[#6366f1]">
                    {listing.seller.display_name || listing.seller.username}
                  </Link>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-600">✓ {t('marketplace.verified')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white border border-[#e8eaf0] rounded-xl p-4">
                <p className="text-xs text-[#8b8fa6] mb-2">{t('marketplace.description')}</p>
                <p className="text-sm text-[#1e2235] whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Buy section */}
            {!isOwnListing ? (
              <div className="bg-white border border-[#e8eaf0] rounded-xl p-4 space-y-3">
                {orderPlaced ? (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-sm font-semibold text-emerald-600">{t('marketplace.orderPlaced')}</p>
                    <p className="text-xs text-[#8b8fa6] mt-1">{t('marketplace.sellerWillBeNotified')}</p>
                    <Link href="/orders" className="inline-block mt-3 px-4 py-2 text-xs font-semibold bg-[#6366f1] text-white rounded-xl hover:bg-[#4f46e5]">
                      {t('marketplace.viewOrders')}
                    </Link>
                  </div>
                ) : (
                  <>
                    {listing.quantity > 1 && (
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-[#8b8fa6]">{t('marketplace.quantity')}:</label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-lg bg-[#f5f6fa] text-[#1e2235] hover:bg-[#e8eaf0] text-sm font-bold">−</button>
                          <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                          <button onClick={() => setQuantity(Math.min(listing.quantity, quantity + 1))} className="w-8 h-8 rounded-lg bg-[#f5f6fa] text-[#1e2235] hover:bg-[#e8eaf0] text-sm font-bold">+</button>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => user ? setShowBuyConfirm(true) : router.push('/login')}
                      className="w-full py-3 bg-[#6366f1] text-white rounded-xl text-sm font-bold hover:bg-[#4f46e5] transition-colors"
                    >
                      {t('marketplace.buyNow')} — {formatPrice(listing.price * quantity, listing.currency)}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-[#f5f6fa] rounded-xl p-4 text-center">
                <p className="text-sm text-[#8b8fa6]">{t('marketplace.ownListing')}</p>
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 text-[10px] text-[#b5b8c8]">
              <span>👁 {listing.views} {t('marketplace.views')}</span>
              <span>📅 {new Date(listing.created_at).toLocaleDateString()}</span>
              <span>🆔 {listing.card_id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Confirmation Modal */}
      {showBuyConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowBuyConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#1e2235] mb-3">{t('marketplace.confirmPurchase')}</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#5c6078]">{t('marketplace.item')}</span>
                <span className="text-[#1e2235] font-semibold">{listing.card_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5c6078]">{t('marketplace.condition')}</span>
                <span className="text-[#1e2235] font-semibold">{t((CONDITION_LABELS[listing.condition] || CONDITION_LABELS.nm) as any)}</span>
              </div>
              {quantity > 1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#5c6078]">{t('marketplace.quantity')}</span>
                  <span className="text-[#1e2235] font-semibold">×{quantity}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-[#e8eaf0] pt-2">
                <span className="text-[#5c6078]">{t('marketplace.total')}</span>
                <span className="text-[#6366f1] font-extrabold">{formatPrice(listing.price * quantity, listing.currency)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowBuyConfirm(false)} className="flex-1 py-2.5 text-sm font-semibold bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#5c6078] hover:text-[#1e2235]">
                {t('common.cancel')}
              </button>
              <button onClick={handleBuy} disabled={buying} className="flex-1 py-2.5 text-sm font-semibold bg-[#6366f1] text-white rounded-xl hover:bg-[#4f46e5] disabled:opacity-50">
                {buying ? t('marketplace.processing') : t('marketplace.confirmBuy')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}