'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/useAuth'
import { useT } from '@/lib/i18n'

interface Order {
  id: string
  buyer_id: string
  seller_id: string
  listing_id: string
  status: string
  price: number
  currency: string
  quantity: number
  shipping_address: string | null
  notes: string | null
  created_at: string
  updated_at: string
  listing: {
    id: string
    card_name: string
    card_image: string | null
    condition: string
    game: string
  }
  buyer: {
    id: string
    username: string
    display_name: string
  }
  seller: {
    id: string
    username: string
    display_name: string
    seller_status: string
  }
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  accepted: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  paid: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  shipped: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
  completed: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  cancelled: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  disputed: 'bg-red-500/15 text-red-500 border-red-500/30',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'marketplace.statusPending',
  accepted: 'marketplace.statusAccepted',
  paid: 'marketplace.statusPaid',
  shipped: 'marketplace.statusShipped',
  completed: 'marketplace.statusCompleted',
  cancelled: 'marketplace.statusCancelled',
  disputed: 'marketplace.statusDisputed',
}

export default function OrdersPage() {
  const { user } = useAuth()
  const t = useT()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetchOrders()
  }, [user, role, statusFilter])

  const fetchOrders = async () => {
    if (!user) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ role, user_id: user.id })
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/orders?${params}`, {
        headers: { 'Authorization': `Bearer ${user.access_token}` },
      })
      const data = await res.json()
      setOrders(data.orders || [])
    } catch {
      setOrders([])
    }
    setLoading(false)
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (!user) return
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({ order_id: orderId, user_id: user.id, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      }
    } catch {}
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: currency || 'USD', minimumFractionDigits: 2,
    }).format(price)
  }

  if (!user) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-[#8b8fa6]">{t('marketplace.signInToViewOrders')}</p>
          <a href="/login" className="inline-block mt-3 px-5 py-2 bg-[#6366f1] text-white rounded-xl text-sm font-bold hover:bg-[#4f46e5]">{t('common.signIn')}</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e2235]">📋 {t('marketplace.myOrders')}</h1>
            <p className="text-xs text-[#8b8fa6] mt-1">{t('marketplace.ordersDesc')}</p>
          </div>
          <Link href="/marketplace" className="px-4 py-2 text-xs font-semibold bg-white border border-[#e8eaf0] text-[#5c6078] rounded-xl hover:border-[#6366f1]/30 transition-colors">
            ← {t('marketplace.backToMarketplace')}
          </Link>
        </div>

        {/* Role tabs */}
        <div className="flex gap-1 bg-[#f5f6fa] rounded-xl p-1 mb-4 w-fit">
          <button
            onClick={() => { setRole('buyer'); setStatusFilter('') }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              role === 'buyer' ? 'bg-[#6366f1] text-white shadow-sm' : 'text-[#5c6078] hover:bg-white/50'
            }`}
          >
            🛒 {t('marketplace.buying')}
          </button>
          <button
            onClick={() => { setRole('seller'); setStatusFilter('') }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              role === 'seller' ? 'bg-[#6366f1] text-white shadow-sm' : 'text-[#5c6078] hover:bg-white/50'
            }`}
          >
            💰 {t('marketplace.selling')}
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {['', 'pending', 'accepted', 'paid', 'shipped', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === s ? 'bg-[#6366f1] text-white' : 'bg-white border border-[#e8eaf0] text-[#5c6078] hover:border-[#6366f1]/30'
              }`}
            >
              {s === '' ? t('marketplace.allStatuses') : t(STATUS_LABELS[s] as any)}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="shimmer h-32 rounded-2xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
            <div className="text-5xl mb-3 opacity-50">📋</div>
            <h2 className="text-lg font-bold text-[#1e2235] mb-1">{t('marketplace.noOrders')}</h2>
            <p className="text-sm text-[#8b8fa6]">{t('marketplace.noOrdersDesc')}</p>
            <Link href="/marketplace" className="inline-block mt-4 px-5 py-2 bg-[#6366f1] text-white rounded-xl text-sm font-bold hover:bg-[#4f46e5]">
              {t('marketplace.browseMarketplace')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-white border border-[#e8eaf0] rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Card image */}
                  <div className="w-16 h-20 sm:w-20 sm:h-24 bg-[#f5f6fa] rounded-xl overflow-hidden shrink-0">
                    {order.listing?.card_image ? (
                      <img src={order.listing.card_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🃏</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-[#1e2235] truncate">{order.listing?.card_name || t('marketplace.unknownCard')}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold border shrink-0 ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                        {t((STATUS_LABELS[order.status] || STATUS_LABELS.pending) as any)}
                      </span>
                    </div>
                    <p className="text-xs text-[#8b8fa6] mb-2">
                      {role === 'buyer'
                        ? `${t('marketplace.from')} @${order.seller?.username || 'unknown'}`
                        : `${t('marketplace.to')} @${order.buyer?.username || 'unknown'}`}
                      {' · '}{formatPrice(order.price, order.currency)}
                      {order.quantity > 1 && ` · ×${order.quantity}`}
                    </p>
                    <p className="text-[10px] text-[#b5b8c8]">
                      {new Date(order.created_at).toLocaleDateString()} · {order.id.slice(0, 12)}...
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0 self-start">
                    {role === 'seller' && order.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(order.id, 'accepted')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                          ✅ {t('marketplace.accept')}
                        </button>
                        <button onClick={() => updateStatus(order.id, 'cancelled')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">
                          ❌ {t('marketplace.reject')}
                        </button>
                      </>
                    )}
                    {role === 'seller' && order.status === 'accepted' && (
                      <span className="text-xs text-amber-500 font-semibold">{t('marketplace.awaitingPayment')}</span>
                    )}
                    {role === 'buyer' && order.status === 'accepted' && (
                      <button onClick={() => updateStatus(order.id, 'paid')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20">
                        💳 {t('marketplace.markPaid')}
                      </button>
                    )}
                    {role === 'seller' && order.status === 'paid' && (
                      <button onClick={() => updateStatus(order.id, 'shipped')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20">
                        📦 {t('marketplace.markShipped')}
                      </button>
                    )}
                    {role === 'buyer' && order.status === 'shipped' && (
                      <button onClick={() => updateStatus(order.id, 'completed')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                        ✅ {t('marketplace.confirmReceived')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}