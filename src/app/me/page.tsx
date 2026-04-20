'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/useAuth'
import { useLocalCollection } from '@/lib/useLocalCollection'
import { useWishlist } from '@/lib/useWishlist'
import { CONDITION_LABELS, GAME_LABELS } from '@/lib/api'
import { useT, type TranslationKey } from '@/lib/i18n'

// ─── Types ───
interface PriceAlert {
  id: string; card_name: string; game: string; card_id: string
  target_price: number; direction: 'below' | 'above'
  is_active: boolean; triggered_at: string | null; created_at: string
}
interface Notification {
  id: string; type: string; message: string; is_read: boolean
  created_at: string; actor: { username: string; avatar_url: string | null } | null
}
interface BadgeDef {
  id: string; name: string; description: string; icon: string; category: string; threshold: number
}
interface TradeOffer {
  id: string; from_user_id: string; to_user_id: string
  offered_card_id: string; offered_game: string; offered_condition: string
  requested_card_id: string; requested_game: string; requested_condition: string
  status: string; message: string | null; created_at: string
  from_user: { username: string; avatar_url: string | null }
  to_user: { username: string; avatar_url: string | null }
}
interface Order {
  id: string; buyer_id: string; seller_id: string; listing_id: string
  status: string; price: number; currency: string; quantity: number
  created_at: string; updated_at: string
  listing: { id: string; card_name: string; card_image: string | null; condition: string; game: string }
  buyer: { id: string; username: string; display_name: string }
  seller: { id: string; username: string; display_name: string; seller_status: string }
}

const NOTIF_ICONS: Record<string, string> = {
  follow: '👤', comment_on_card: '💬', comment_on_thread: '💬',
  reply_to_thread: '↩️', wishlist_match: '💭', trade_offer: '🤝',
  badge_earned: '🏅', trade_completed: '✅',
}
const TRADE_COLORS: Record<string, string> = {
  pending: 'bg-[#6366f1]/15 text-[#6366f1]', accepted: 'bg-emerald-50 text-emerald-500',
  rejected: 'bg-red-500/15 text-red-400', cancelled: 'bg-[#e8eaf0] text-[#8b8fa6]',
  completed: 'bg-blue-500/15 text-blue-400',
}
const ORDER_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-600', accepted: 'bg-blue-500/15 text-blue-600',
  paid: 'bg-emerald-500/15 text-emerald-600', shipped: 'bg-purple-500/15 text-purple-600',
  completed: 'bg-emerald-500/15 text-emerald-600', cancelled: 'bg-gray-500/15 text-gray-400',
  disputed: 'bg-red-500/15 text-red-500',
}

type Tab = 'collection' | 'watchlist' | 'alerts' | 'notifications' | 'trades' | 'orders' | 'badges'

export default function MePage() {
  const { user, isGuest, isAuthenticated, loading: authLoading, logout } = useAuth()
  const { cards, isLoaded, removeCard, updateCard, totalValue, totalInvested, totalCards } = useLocalCollection()
  const { items: wishlistItems, loading: wishlistLoading } = useWishlist()
  const t = useT()

  const [tab, setTab] = useState<Tab>('collection')
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [badges, setBadges] = useState<BadgeDef[]>([])
  const [trades, setTrades] = useState<TradeOffer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [orderRole, setOrderRole] = useState<'buyer' | 'seller'>('buyer')
  const [loading, setLoading] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null)

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // Fetch profile
  useEffect(() => {
    if (!user) return
    fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=username,display_name,avatar_url`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${user.access_token}` },
    }).then(r => r.json()).then(data => {
      if (data?.[0]) {
        setProfileName(data[0].display_name || data[0].username || '')
        setProfileAvatar(data[0].avatar_url || null)
      }
    }).catch(() => {})
  }, [user, SUPABASE_URL, SUPABASE_ANON_KEY])

  // Fetch data per tab
  useEffect(() => {
    if (!user && tab !== 'badges') return
    setLoading(true)
    const headers: Record<string, string> = user ? { 'Authorization': `Bearer ${user.access_token}` } : {}

    if (tab === 'alerts' && user) {
      fetch('/api/price-alerts', { headers }).then(r => r.json()).then(d => { setAlerts(d.alerts || []); setLoading(false) }).catch(() => setLoading(false))
    } else if (tab === 'notifications' && user) {
      fetch('/api/notifications', { headers }).then(r => r.json()).then(d => { setNotifications(d.notifications || []); setUnreadCount(d.unread_count || 0); setLoading(false) }).catch(() => setLoading(false))
    } else if (tab === 'badges') {
      fetch('/api/badges').then(r => r.json()).then(d => { setBadges(d.badges || []); setLoading(false) }).catch(() => setLoading(false))
    } else if (tab === 'trades' && user) {
      fetch('/api/trades', { headers }).then(r => r.json()).then(d => { setTrades(d.offers || []); setLoading(false) }).catch(() => setLoading(false))
    } else if (tab === 'orders' && user) {
      fetch(`/api/orders?role=${orderRole}&user_id=${user.id}`, { headers }).then(r => r.json()).then(d => { setOrders(d.orders || []); setLoading(false) }).catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [tab, user, orderRole])

  const markAllRead = async () => {
    if (!user) return
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` }, body: JSON.stringify({ mark_all_read: true }) })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const toggleAlert = async (id: string, isActive: boolean) => {
    if (!user) return
    const res = await fetch('/api/price-alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` }, body: JSON.stringify({ id, is_active: !isActive }) })
    if (res.ok) setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: !isActive } : a))
  }

  const deleteAlert = async (id: string) => {
    if (!user) return
    const res = await fetch(`/api/price-alerts?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${user.access_token}` } })
    if (res.ok) setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!user) return
    const res = await fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` }, body: JSON.stringify({ order_id: orderId, user_id: user.id, status: newStatus }) })
    if (res.ok && (await res.json()).success) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
  }

  const updateTradeStatus = async (offerId: string, status: string) => {
    if (!user) return
    await fetch('/api/trades', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` }, body: JSON.stringify({ offer_id: offerId, status }) })
    setTrades(prev => prev.map(o => o.id === offerId ? { ...o, status } : o))
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m {t('common.ago')}`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h {t('common.ago')}`
    const days = Math.floor(hours / 24)
    return `${days}d {t('common.ago')}`
  }

  const profitLoss = totalValue - totalInvested
  const profitPct = totalInvested > 0 ? ((profitLoss / totalInvested) * 100) : 0

  const tabs: { key: Tab; icon: string; labelKey: TranslationKey; badge?: number }[] = [
    { key: 'collection', icon: '🃏', labelKey: 'me.collection' },
    { key: 'watchlist', icon: '⭐', labelKey: 'me.watchlist', badge: wishlistItems.length },
    { key: 'alerts', icon: '🔔', labelKey: 'me.alerts', badge: alerts.filter(a => a.is_active).length },
    { key: 'notifications', icon: '💬', labelKey: 'me.notifications', badge: unreadCount },
    { key: 'trades', icon: '🤝', labelKey: 'me.trades' },
    { key: 'orders', icon: '📦', labelKey: 'me.orders' },
    { key: 'badges', icon: '🏅', labelKey: 'me.badges' },
  ]

  // ─── Not logged in ───
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-6">👤</div>
          <h1 className="text-3xl font-extrabold text-[#1e2235] mb-3">{t('me.title')}</h1>
          <p className="text-[#5c6078] mb-8">{t('me.signInDesc')}</p>
          <Link href="/login" className="inline-block px-8 py-3.5 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] transition-all text-lg shadow-sm shadow-[#6366f1]/25">
            {t('nav.signIn')}
          </Link>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]"><div className="text-[#8b8fa6]">{t('common.loading')}</div></div>
  }

  // ─── Main Dashboard ───
  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Profile Header */}
        <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6366f1] to-[#a78bfa] flex items-center justify-center text-white text-xl font-bold overflow-hidden shadow-md shadow-[#6366f1]/20">
              {profileAvatar ? <img src={profileAvatar} alt="" className="w-full h-full object-cover" /> : (profileName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?')}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold text-[#1e2235] truncate">{profileName || user?.email?.split('@')[0] || 'Collector'}</h1>
              {isGuest && <span className="text-xs px-2 py-0.5 bg-[#6366f1]/10 text-[#6366f1] rounded-lg font-semibold">{t('common.guestMode')}</span>}
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Link href={`/u/${user?.email?.split('@')[0] || ''}`} className="px-3 py-1.5 text-xs font-semibold text-[#5c6078] hover:text-[#6366f1] border border-[#e8eaf0] rounded-lg hover:border-[#6366f1]/30 transition-all">
                {t('me.viewProfile')}
              </Link>
              <button onClick={logout} className="px-3 py-1.5 text-xs font-semibold text-[#b5b8c8] hover:text-red-400 border border-[#e8eaf0] rounded-lg hover:border-red-400/30 transition-all">
                {t('nav.signOut')}
              </button>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            <div className="bg-[#f5f6fa] rounded-xl p-3 text-center">
              <p className="text-[10px] text-[#8b8fa6] font-medium">{t('collection.totalCards')}</p>
              <p className="text-lg font-extrabold text-[#1e2235]">{totalCards}</p>
            </div>
            <div className="bg-[#f5f6fa] rounded-xl p-3 text-center">
              <p className="text-[10px] text-[#8b8fa6] font-medium">{t('collection.value')}</p>
              <p className="text-lg font-extrabold text-[#6366f1]">${totalValue.toFixed(0)}</p>
            </div>
            <div className="bg-[#f5f6fa] rounded-xl p-3 text-center">
              <p className="text-[10px] text-[#8b8fa6] font-medium">{t('collection.invested')}</p>
              <p className="text-lg font-extrabold text-[#3b3f56]">${totalInvested.toFixed(0)}</p>
            </div>
            <div className="bg-[#f5f6fa] rounded-xl p-3 text-center">
              <p className="text-[10px] text-[#8b8fa6] font-medium">{t('collection.profitLoss')}</p>
              <p className={`text-lg font-extrabold ${profitLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {profitLoss >= 0 ? '+' : ''}{profitLoss.toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Scrollable */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
          {tabs.map(tb => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                tab === tb.key
                  ? 'bg-[#6366f1] text-white shadow-sm shadow-[#6366f1]/20'
                  : 'bg-white border border-[#e8eaf0] text-[#5c6078] hover:text-[#1e2235] hover:border-[#6366f1]/20'
              }`}
            >
              <span>{tb.icon}</span>
              <span>{t(tb.labelKey)}</span>
              {tb.badge && tb.badge > 0 && (
                <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === tb.key ? 'bg-white/20 text-white' : 'bg-[#6366f1]/10 text-[#6366f1]'
                }`}>
                  {tb.badge > 99 ? '99+' : tb.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Tab Content ─── */}
        {tab === 'collection' && <CollectionTab cards={cards} isLoaded={isLoaded} removeCard={removeCard} updateCard={updateCard} t={t} />}
        {tab === 'watchlist' && <WatchlistTab items={wishlistItems} loading={wishlistLoading} t={t} />}
        {tab === 'alerts' && <AlertsTab alerts={alerts} loading={loading} toggleAlert={toggleAlert} deleteAlert={deleteAlert} t={t} />}
        {tab === 'notifications' && <NotificationsTab notifications={notifications} unreadCount={unreadCount} loading={loading} markAllRead={markAllRead} t={t} />}
        {tab === 'trades' && <TradesTab trades={trades} loading={loading} userId={user?.id || ''} updateStatus={updateTradeStatus} t={t} />}
        {tab === 'orders' && <OrdersTab orders={orders} loading={loading} role={orderRole} setRole={setOrderRole} userId={user?.id || ''} updateStatus={updateOrderStatus} t={t} />}
        {tab === 'badges' && <BadgesTab badges={badges} loading={loading} t={t} />}
      </div>
    </div>
  )
}

// ─── Collection Tab ───
function CollectionTab({ cards, isLoaded, removeCard, updateCard, t }: any) {
  if (!isLoaded) return <div className="text-center py-8 text-[#8b8fa6]">{t('common.loading')}</div>
  if (cards.length === 0) return (
    <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
      <div className="text-5xl mb-4">📦</div>
      <p className="text-[#1e2235] text-lg font-bold mb-2">{t('collection.empty')}</p>
      <p className="text-[#8b8fa6] text-sm mb-6">{t('collection.emptyDesc')}</p>
      <Link href="/search" className="inline-block px-6 py-3 bg-[#6366f1] text-white font-semibold rounded-xl hover:bg-[#4f46e5]">{t('home.hero.cta')} →</Link>
    </div>
  )
  return (
    <div className="space-y-2.5">
      {cards.map((card: any) => (
        <div key={card.id} className="bg-white border border-[#e8eaf0] rounded-xl p-3.5 flex items-center gap-3 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all">
          <img src={card.imageUrl} alt={card.name} className="w-12 h-16 object-contain rounded" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[#1e2235] truncate">{card.name}</h3>
            <p className="text-xs text-[#8b8fa6] truncate">{card.setName}</p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-[10px] text-[#b5b8c8]">{t('collection.condition')}</p>
            <p className="text-xs text-[#3b3f56]">{CONDITION_LABELS[card.condition] || card.condition}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => card.quantity > 1 && updateCard(card.id, { quantity: card.quantity - 1 })} className="w-6 h-6 bg-[#fafbfc] rounded text-[#8b8fa6] hover:text-[#1e2235] text-xs border border-[#e8eaf0]">-</button>
            <span className="text-sm text-[#1e2235] font-bold w-6 text-center">{card.quantity}</span>
            <button onClick={() => updateCard(card.id, { quantity: card.quantity + 1 })} className="w-6 h-6 bg-[#fafbfc] rounded text-[#8b8fa6] hover:text-[#1e2235] text-xs border border-[#e8eaf0]">+</button>
          </div>
          <div className="text-right hidden sm:block">
            {card.marketPrice && <p className="text-sm font-extrabold text-[#6366f1]">${card.marketPrice.toFixed(2)}</p>}
          </div>
          <button onClick={() => { if (confirm(t('collection.removeConfirm'))) removeCard(card.id) }} className="w-7 h-7 flex items-center justify-center text-[#b5b8c8] hover:text-red-500 transition-colors text-sm">✕</button>
        </div>
      ))}
      <div className="text-center pt-4">
        <Link href="/search" className="text-sm text-[#6366f1] font-semibold hover:underline">+ {t('collection.addMore')}</Link>
      </div>
    </div>
  )
}

// ─── Watchlist Tab ───
function WatchlistTab({ items, loading, t }: any) {
  if (loading) return <div className="text-center py-8 text-[#8b8fa6]">{t('common.loading')}</div>
  if (items.length === 0) return (
    <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
      <div className="text-5xl mb-4">⭐</div>
      <p className="text-[#1e2235] text-lg font-bold mb-2">{t('me.noWatchlist')}</p>
      <p className="text-[#8b8fa6] text-sm mb-6">{t('me.noWatchlistDesc')}</p>
      <Link href="/search" className="inline-block px-6 py-3 bg-[#6366f1] text-white font-semibold rounded-xl hover:bg-[#4f46e5]">{t('home.hero.cta')} →</Link>
    </div>
  )
  const getCardLink = (cardId: string, game: string) => {
    if (game === 'pokemon') return `/card/pokemon/${cardId}`
    if (game === 'onepiece') return `/card/onepiece/${encodeURIComponent(cardId)}`
    if (game === 'pokemon-jp') return `/card/pokemon-jp/${encodeURIComponent(cardId)}`
    return '#'
  }
  const getGameIcon = (game: string) => {
    if (game === 'pokemon') return '🔴'
    if (game === 'onepiece') return '🏴‍☠️'
    if (game === 'pokemon-jp') return '🇯🇵'
    return '🃏'
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[#8b8fa6]">{items.length} {t('me.cards')}</p>
      </div>
      <div className="space-y-2.5">
        {items.map((item: any) => (
          <Link key={item.id} href={getCardLink(item.card_id, item.game)} className="bg-white border border-[#e8eaf0] rounded-xl p-3.5 flex items-center gap-3 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all group">
            <div className="w-10 h-10 rounded-lg bg-[#f5f6fa] flex items-center justify-center text-lg">{getGameIcon(item.game)}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#1e2235] group-hover:text-[#6366f1] transition-colors truncate">{item.card_name || item.card_id}</h3>
              <p className="text-xs text-[#8b8fa6]">{GAME_LABELS[item.game as keyof typeof GAME_LABELS] || item.game}{item.notes ? ` · ${item.notes}` : ''}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${
              item.priority === 'high' ? 'bg-red-500/10 text-red-400' :
              item.priority === 'low' ? 'bg-[#e8eaf0] text-[#8b8fa6]' :
              'bg-[#6366f1]/10 text-[#6366f1]'
            }`}>{item.priority}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Alerts Tab ───
function AlertsTab({ alerts, loading, toggleAlert, deleteAlert, t }: any) {
  if (loading) return <div className="text-center py-8 text-[#8b8fa6]">{t('common.loading')}</div>
  if (alerts.length === 0) return (
    <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
      <div className="text-5xl mb-4">🔕</div>
      <p className="text-[#1e2235] text-lg font-bold mb-2">{t('alerts.noAlerts')}</p>
      <p className="text-[#8b8fa6] text-sm mb-6">{t('alerts.noAlertsDescFull')}</p>
      <Link href="/search" className="inline-block px-5 py-2 bg-[#6366f1] text-white font-bold rounded-xl text-sm">{t('alerts.searchCards')}</Link>
    </div>
  )
  return (
    <div className="space-y-2.5">
      {alerts.map((alert: PriceAlert) => (
        <div key={alert.id} className={`bg-white border rounded-xl p-3.5 transition-all ${alert.is_active ? 'border-[#e8eaf0]' : 'border-[#e8eaf0] opacity-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${alert.direction === 'below' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {alert.direction === 'below' ? '📉' : '📈'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#1e2235] truncate">{alert.card_name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-[#8b8fa6]">
                <span>{alert.direction === 'below' ? t('alerts.below') : t('alerts.above')} ${alert.target_price.toFixed(2)}</span>
                {alert.triggered_at && <span className="text-[#6366f1] font-semibold">✅ {t('alerts.triggered')}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => toggleAlert(alert.id, alert.is_active)} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${alert.is_active ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'bg-[#fafbfc] text-[#8b8fa6]'}`}>
                {alert.is_active ? t('alerts.on') : t('alerts.off')}
              </button>
              <button onClick={() => deleteAlert(alert.id)} className="px-1.5 py-1 text-red-400 hover:text-red-600 rounded-lg transition-all text-xs">✕</button>
            </div>
          </div>
        </div>
      ))}
      <div className="text-center pt-3">
        <Link href="/search" className="text-sm text-[#6366f1] font-semibold hover:underline">+ {t('alerts.addNewAlert')}</Link>
      </div>
    </div>
  )
}

// ─── Notifications Tab ───
function NotificationsTab({ notifications, unreadCount, loading, markAllRead, t }: any) {
  if (loading) return <div className="text-center py-8 text-[#8b8fa6]">{t('common.loading')}</div>
  if (notifications.length === 0) return (
    <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
      <div className="text-5xl mb-4 opacity-50">🔔</div>
      <p className="text-[#5c6078] text-lg mb-1">{t('notif.none')}</p>
      <p className="text-[#b5b8c8] text-xs">{t('notif.noneDesc')}</p>
    </div>
  )
  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex justify-end mb-3">
          <button onClick={markAllRead} className="text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5]">{t('notif.markAllRead')}</button>
        </div>
      )}
      <div className="space-y-2">
        {notifications.map((n: Notification) => (
          <div key={n.id} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${n.is_read ? 'bg-white border-[#e8eaf0]' : 'bg-[#6366f1]/5 border-[#6366f1]/20'}`}>
            <div className="text-lg flex-shrink-0 mt-0.5">{NOTIF_ICONS[n.type] || '🔔'}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-relaxed ${n.is_read ? 'text-[#5c6078]' : 'text-[#1e2235] font-medium'}`}>
                {n.actor && <a href={`/u/${n.actor.username || ''}`} className="text-[#6366f1] hover:text-[#4f46e5] font-semibold">{n.actor.username}</a>}{' '}{n.message}
              </p>
            </div>
            {!n.is_read && <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-2" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Trades Tab ───
function TradesTab({ trades, loading, userId, updateStatus, t }: any) {
  if (loading) return <div className="text-center py-8 text-[#8b8fa6]">{t('common.loading')}</div>
  if (trades.length === 0) return (
    <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
      <div className="text-5xl mb-4 opacity-50">🤝</div>
      <p className="text-[#1e2235] text-lg font-bold mb-2">{t('trades.noTrades')}</p>
      <p className="text-[#8b8fa6] text-sm">{t('trades.noTradesDesc')}</p>
    </div>
  )
  return (
    <div className="space-y-2.5">
      {trades.map((offer: TradeOffer) => {
        const isIncoming = offer.to_user_id === userId
        const otherUser = isIncoming ? offer.from_user : offer.to_user
        return (
          <div key={offer.id} className="bg-white border border-[#e8eaf0] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold ${TRADE_COLORS[offer.status] || ''}`}>{offer.status}</span>
              <span className="text-xs text-[#8b8fa6]">
                <a href={`/u/${otherUser?.username || ''}`} className="text-[#6366f1] font-semibold">{otherUser?.username || 'Unknown'}</a>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div className="bg-[#fafbfc] rounded-lg p-2.5"><p className="text-[10px] text-[#b5b8c8] uppercase mb-0.5">{t('trades.offered')}</p><p className="font-semibold text-[#1e2235] truncate">{offer.offered_card_id}</p></div>
              <div className="bg-[#fafbfc] rounded-lg p-2.5"><p className="text-[10px] text-[#b5b8c8] uppercase mb-0.5">{t('trades.requested')}</p><p className="font-semibold text-[#1e2235] truncate">{offer.requested_card_id}</p></div>
            </div>
            {offer.status === 'pending' && isIncoming && (
              <div className="flex gap-2">
                <button onClick={() => updateStatus(offer.id, 'accepted')} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-400">{t('trades.accept')}</button>
                <button onClick={() => updateStatus(offer.id, 'rejected')} className="px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg text-xs font-semibold">{t('trades.reject')}</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Orders Tab ───
function OrdersTab({ orders, loading, role, setRole, userId, updateStatus, t }: any) {
  if (loading) return <div className="text-center py-8 text-[#8b8fa6]">{t('common.loading')}</div>
  return (
    <div>
      <div className="flex gap-1 bg-[#f5f6fa] rounded-lg p-0.5 mb-4 w-fit">
        <button onClick={() => setRole('buyer')} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${role === 'buyer' ? 'bg-[#6366f1] text-white' : 'text-[#5c6078]'}`}>🛒 {t('marketplace.buying')}</button>
        <button onClick={() => setRole('seller')} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${role === 'seller' ? 'bg-[#6366f1] text-white' : 'text-[#5c6078]'}`}>💰 {t('marketplace.selling')}</button>
      </div>
      {orders.length === 0 ? (
        <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3 opacity-50">📦</div>
          <h2 className="text-lg font-bold text-[#1e2235] mb-1">{t('marketplace.noOrders')}</h2>
          <p className="text-sm text-[#8b8fa6]">{t('marketplace.noOrdersDesc')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orders.map((order: Order) => (
            <div key={order.id} className="bg-white border border-[#e8eaf0] rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-12 h-14 bg-[#f5f6fa] rounded-lg overflow-hidden shrink-0">
                {order.listing?.card_image ? <img src={order.listing.card_image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl opacity-30">🃏</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-bold text-[#1e2235] truncate">{order.listing?.card_name || 'Card'}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${ORDER_STYLES[order.status] || ''}`}>{order.status}</span>
                </div>
                <p className="text-xs text-[#8b8fa6]">
                  {role === 'buyer' ? `${t('marketplace.from')} @${order.seller?.username || '?'}` : `${t('marketplace.to')} @${order.buyer?.username || '?'}`}
                  {' · '}{new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'USD' }).format(order.price)}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {role === 'seller' && order.status === 'pending' && (
                  <button onClick={() => updateStatus(order.id, 'accepted')} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">✅</button>
                )}
                {role === 'buyer' && order.status === 'accepted' && (
                  <button onClick={() => updateStatus(order.id, 'paid')} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-[#6366f1]/10 text-[#6366f1]">💳</button>
                )}
                {role === 'seller' && order.status === 'paid' && (
                  <button onClick={() => updateStatus(order.id, 'shipped')} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-purple-500/10 text-purple-600">📦</button>
                )}
                {role === 'buyer' && order.status === 'shipped' && (
                  <button onClick={() => updateStatus(order.id, 'completed')} className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-emerald-500/10 text-emerald-600">✅</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Badges Tab ───
function BadgesTab({ badges, loading, t }: any) {
  if (loading) return <div className="text-center py-8 text-[#8b8fa6]">{t('common.loading')}</div>
  if (badges.length === 0) return (
    <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
      <div className="text-5xl mb-4 opacity-50">🏅</div>
      <p className="text-[#1e2235] text-lg font-bold mb-2">{t('badges.title')}</p>
      <p className="text-[#8b8fa6] text-sm">{t('badges.subtitle')}</p>
    </div>
  )
  const byCategory = badges.reduce((acc: any, b: BadgeDef) => { if (!acc[b.category]) acc[b.category] = []; acc[b.category].push(b); return acc }, {})
  return (
    <div className="space-y-8">
      {Object.entries(byCategory).map(([cat, catBadges]: any) => (
        <div key={cat}>
          <h2 className="text-sm font-bold text-[#6366f1] uppercase tracking-wider mb-3">{cat}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {catBadges.map((badge: BadgeDef) => (
              <div key={badge.id} className="bg-white border border-[#e8eaf0] rounded-xl p-4 text-center hover:shadow-md hover:shadow-[#6366f1]/5 transition-all">
                <div className="text-3xl mb-2">{badge.icon}</div>
                <p className="text-xs font-bold text-[#1e2235]">{badge.name}</p>
                <p className="text-[10px] text-[#8b8fa6] mt-1 leading-relaxed">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}