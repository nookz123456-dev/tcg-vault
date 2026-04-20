'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/useAuth'
import { useT, useLocale } from '@/lib/i18n'

interface Stats {
  totalUsers: number
  totalThreads: number
  totalComments: number
  pendingSellers: number
  verifiedSellers: number
  completedTrades: number
  totalListings: number
  totalOrders: number
  disputedOrders: number
  newUsersToday: number
  newUsersThisWeek: number
}

interface User {
  id: string
  username: string
  display_name: string
  email?: string
  role: string
  created_at: string
  seller_status?: string
  ban_reason?: string
}

interface Thread {
  id: string
  title: string
  is_pinned: boolean
  created_at: string
}

interface Comment {
  id: string
  thread_id: string
  content: string
  created_at: string
  profiles: { id: string; username: string; display_name: string } | null
}

interface SellerApp {
  id: string
  real_name: string
  status: string
  shop_name: string | null
  created_at: string
  profiles: { id: string; username: string; display_name: string }[]
}

interface Announcement {
  id: string
  title: string
  content: string
  priority: string
  created_at: string
}

interface Activity {
  id: string
  user_id: string
  action_type: string
  description: string
  created_at: string
}

interface Listing {
  id: string
  seller_id: string
  game: string
  card_id: string
  card_name: string
  condition: string
  price: number
  currency: string
  is_active: boolean
  created_at: string
  seller: { id: string; username: string; display_name: string }
}

interface Order {
  id: string
  buyer_id: string
  seller_id: string
  status: string
  price: number
  currency: string
  created_at: string
  listing: { card_name: string }
  buyer: { username: string; display_name: string }
  seller: { username: string; display_name: string }
}

interface DailyCount {
  date: string
  count: number
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/15 text-red-400 border border-red-500/30',
  moderator: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  user: 'bg-[#6366f1]/15 text-[#6366f1] border border-[#6366f1]/30',
  suspended: 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-500/15 text-blue-500 border border-blue-500/30',
  normal: 'bg-[#6366f1]/15 text-[#6366f1] border border-[#6366f1]/30',
  high: 'bg-amber-500/15 text-amber-500 border border-amber-500/30',
  urgent: 'bg-red-500/15 text-red-400 border border-red-500/30',
}

type TabType = 'overview' | 'users' | 'sellers' | 'threads' | 'comments' | 'announcements' | 'marketplace'

export default function AdminPage() {
  const { user } = useAuth()
  const t = useT()
  const { locale } = useLocale()
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [recentThreads, setRecentThreads] = useState<Thread[]>([])
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [signupTrend, setSignupTrend] = useState<DailyCount[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [sellerApps, setSellerApps] = useState<SellerApp[]>([])
  const [sellerFilter, setSellerFilter] = useState('all')
  const [comments, setComments] = useState<Comment[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [marketplaceFilter, setMarketplaceFilter] = useState<'listings' | 'disputed'>('disputed')
  const [tab, setTab] = useState<TabType>('overview')
  const [actionLoading, setActionLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [showAnnounceForm, setShowAnnounceForm] = useState(false)
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceContent, setAnnounceContent] = useState('')
  const [announcePriority, setAnnouncePriority] = useState('normal')
  const [exportLoading, setExportLoading] = useState(false)

  // Initial auth check + overview data
  useEffect(() => {
    if (!user) { setLoading(false); return }
    const headers = { 'Authorization': `Bearer ${user.access_token}` }
    fetch('/api/admin', { headers })
      .then(r => {
        if (r.status === 403) { setIsAuthorized(false); setLoading(false); return null }
        if (!r.ok) { setLoading(false); return null }
        setIsAuthorized(true)
        return r.json()
      })
      .then(data => {
        if (data) {
          setStats(data.stats)
          setRecentUsers(data.recentUsers || [])
          setRecentThreads(data.recentThreads || [])
          setRecentActivities(data.recentActivities || [])
          setSignupTrend(data.signupTrend || [])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  // Load section data on tab change
  useEffect(() => {
    if (!user || !isAuthorized) return
    const headers = { 'Authorization': `Bearer ${user.access_token}` }

    if (tab === 'users') {
      fetch(`/api/admin?section=users${userSearch ? `&search=${userSearch}` : ''}`, { headers })
        .then(r => r.json()).then(data => setAllUsers(data.users || [])).catch(() => {})
    }
    if (tab === 'sellers') {
      fetch(`/api/admin?section=sellers&status=${sellerFilter}`, { headers })
        .then(r => r.json()).then(data => setSellerApps(data.sellers || [])).catch(() => {})
    }
    if (tab === 'comments') {
      fetch('/api/admin?section=comments', { headers })
        .then(r => r.json()).then(data => setComments(data.comments || [])).catch(() => {})
    }
    if (tab === 'announcements') {
      fetch('/api/admin?section=announcements', { headers })
        .then(r => r.json()).then(data => setAnnouncements(data.announcements || [])).catch(() => {})
    }
    if (tab === 'marketplace') {
      loadMarketplaceData()
    }
  }, [tab, user, isAuthorized, userSearch, sellerFilter, marketplaceFilter])

  const loadMarketplaceData = async () => {
    if (!user) return
    const headers = { 'Authorization': `Bearer ${user.access_token}` }
    if (marketplaceFilter === 'disputed') {
      const res = await fetch('/api/admin?section=disputed-orders', { headers })
      const data = await res.json()
      setOrders(data.orders || [])
    } else {
      const res = await fetch('/api/admin?section=all-listings', { headers })
      const data = await res.json()
      setListings(data.listings || [])
    }
  }

  const adminAction = async (body: Record<string, unknown>) => {
    if (!user) return false
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setActionLoading(false)
      return data.success
    } catch { setActionLoading(false); return false }
  }

  const exportCSV = async (type: 'users' | 'orders' | 'listings') => {
    if (!user) return
    setExportLoading(true)
    try {
      const res = await fetch(`/api/admin?section=export-${type}`, {
        headers: { 'Authorization': `Bearer ${user.access_token}` },
      })
      const data = await res.json()
      if (data.csv) {
        const blob = new Blob([data.csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `holocheck-${type}-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {}
    setExportLoading(false)
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 2 }).format(price)
  }

  if (!user) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-[#8b8fa6]">{t('admin.signInToAccess')}</p>
          <a href="/login" className="inline-block mt-3 px-5 py-2 bg-[#6366f1] text-white rounded-xl text-sm font-bold hover:bg-[#4f46e5]">{t('common.signIn')}</a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="shimmer h-8 w-48 rounded-lg mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <div key={i} className="shimmer h-24 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-[#1e2235] mb-2">{t('admin.accessDenied')}</h2>
          <p className="text-[#8b8fa6]">{t('admin.needAdmin')}</p>
          <a href="/community" className="inline-block mt-4 px-5 py-2 bg-[#6366f1] text-white rounded-xl text-sm font-bold hover:bg-[#4f46e5]">{t('admin.backToCommunity')}</a>
        </div>
      </div>
    )
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: locale === 'th' ? 'ภาพรวม' : 'Overview' },
    { key: 'users', label: t('admin.users') },
    { key: 'sellers', label: t('admin.manageSellers') },
    { key: 'marketplace', label: t('admin.marketplaceTab') },
    { key: 'threads', label: t('admin.threads') },
    { key: 'comments', label: t('admin.comments') },
    { key: 'announcements', label: t('admin.announcementsLabel') },
  ]

  const tabIcons: Record<TabType, string> = {
    overview: '📊', users: '👥', sellers: '🏪', marketplace: '🛒', threads: '💬', comments: '💭', announcements: '📢',
  }

  // Mini bar chart for signup trend
  const maxSignupCount = Math.max(...signupTrend.map(d => d.count), 1)

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1e2235]">
              🛡️ {t('admin.panel')}
            </h1>
            <p className="text-xs sm:text-sm text-[#8b8fa6] mt-1">
              {t('admin.manageDesc')}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
              ADMIN
            </span>
            {/* Export buttons */}
            <div className="relative group">
              <button className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-white border border-[#e8eaf0] text-[#5c6078] hover:border-[#6366f1]/30 transition-colors">
                📥 {t('admin.export')}
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e8eaf0] rounded-xl shadow-lg p-1 hidden group-hover:block z-10 min-w-[140px]">
                <button onClick={() => exportCSV('users')} disabled={exportLoading} className="w-full text-left px-3 py-2 text-xs text-[#1e2235] hover:bg-[#f5f6fa] rounded-lg">👥 {t('admin.exportUsers')}</button>
                <button onClick={() => exportCSV('orders')} disabled={exportLoading} className="w-full text-left px-3 py-2 text-xs text-[#1e2235] hover:bg-[#f5f6fa] rounded-lg">📋 {t('admin.exportOrders')}</button>
                <button onClick={() => exportCSV('listings')} disabled={exportLoading} className="w-full text-left px-3 py-2 text-xs text-[#1e2235] hover:bg-[#f5f6fa] rounded-lg">🛒 {t('admin.exportListings')}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs — scrollable on mobile */}
        <div className="flex gap-1 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl p-1 mb-6 overflow-x-auto no-scrollbar">
          {tabs.map(tb => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                tab === tb.key ? 'bg-[#6366f1] text-white shadow-sm' : 'text-[#5c6078] hover:text-[#1e2235] hover:bg-white/50'
              }`}
            >
              <span>{tabIcons[tb.key]}</span>
              {/* Notification badge for disputed orders */}
              {tb.key === 'marketplace' && stats && stats.disputedOrders > 0 && (
                <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">{stats.disputedOrders}</span>
              )}
              <span>{tb.label}</span>
            </button>
          ))}
        </div>

        {/* ===================== OVERVIEW ===================== */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: t('admin.users'), value: stats.totalUsers, icon: '👥', color: 'text-[#6366f1]', sub: stats.newUsersToday > 0 ? `+${stats.newUsersToday} ${t('admin.today')}` : undefined },
                { label: t('admin.threads'), value: stats.totalThreads, icon: '💬', color: 'text-emerald-500' },
                { label: t('admin.comments'), value: stats.totalComments, icon: '💭', color: 'text-amber-500' },
                { label: t('admin.pending'), value: stats.pendingSellers, icon: '⏳', color: 'text-orange-500' },
                { label: t('admin.verified'), value: stats.verifiedSellers, icon: '✅', color: 'text-emerald-500' },
                { label: t('admin.completedTrades'), value: stats.completedTrades, icon: '🤝', color: 'text-blue-500' },
                { label: t('admin.marketplaceTab'), value: stats.totalListings, icon: '🛒', color: 'text-purple-500' },
                { label: t('admin.totalOrders'), value: stats.totalOrders, icon: '📋', color: 'text-cyan-500' },
                { label: t('admin.disputed'), value: stats.disputedOrders, icon: '⚠️', color: 'text-red-500' },
                { label: t('admin.newThisWeek'), value: stats.newUsersThisWeek, icon: '📈', color: 'text-emerald-500' },
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-[#e8eaf0] rounded-2xl p-3 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl mb-1">{stat.icon}</div>
                  <p className={`text-xl sm:text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-[#8b8fa6] mt-0.5">{stat.label}</p>
                  {stat.sub && <p className="text-[10px] text-emerald-500 font-semibold mt-0.5">{stat.sub}</p>}
                </div>
              ))}
            </div>

            {/* Signup Trend (7 days) */}
            {signupTrend.length > 0 && (
              <div className="bg-white border border-[#e8eaf0] rounded-2xl p-4 sm:p-5">
                <h2 className="text-lg font-bold text-[#1e2235] mb-3">📈 {t('admin.signupTrend')}</h2>
                <div className="flex items-end gap-1.5 h-24">
                  {signupTrend.map((d, i) => {
                    const height = Math.max((d.count / maxSignupCount) * 100, 4)
                    const dayLabel = new Date(d.date).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { weekday: 'short' })
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-semibold text-[#6366f1]">{d.count}</span>
                        <div className="w-full bg-[#6366f1]/20 rounded-t-md transition-all" style={{ height: `${height}%`, minHeight: '4px' }}>
                          <div className="w-full h-full bg-[#6366f1] rounded-t-md opacity-80" style={{ height: '100%' }} />
                        </div>
                        <span className="text-[9px] text-[#8b8fa6]">{dayLabel}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white border border-[#e8eaf0] rounded-2xl p-4 sm:p-5">
              <h2 className="text-lg font-bold text-[#1e2235] mb-3">📋 {t('admin.recentActivity')}</h2>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-[#8b8fa6] text-center py-4">{t('admin.noActivity')}</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentActivities.slice(0, 10).map(a => (
                    <div key={a.id} className="flex items-start gap-2 py-2 border-b border-[#f5f6fa] last:border-0">
                      <span className="text-xs text-[#8b8fa6] whitespace-nowrap">{new Date(a.created_at).toLocaleDateString()}</span>
                      <p className="text-sm text-[#1e2235]">{a.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button onClick={() => setTab('sellers')} className="bg-white border border-[#e8eaf0] rounded-xl p-4 text-center hover:border-[#6366f1]/30 transition-colors">
                <div className="text-2xl mb-1">🏪</div>
                <p className="text-xs font-semibold text-[#1e2235]">{t('admin.manageSellers')}</p>
                {stats.pendingSellers > 0 && <span className="text-[10px] text-amber-500 font-semibold">{stats.pendingSellers} {t('admin.pendingShort')}</span>}
              </button>
              <button onClick={() => setTab('users')} className="bg-white border border-[#e8eaf0] rounded-xl p-4 text-center hover:border-[#6366f1]/30 transition-colors">
                <div className="text-2xl mb-1">👥</div>
                <p className="text-xs font-semibold text-[#1e2235]">{t('admin.manageUsers')}</p>
              </button>
              <button onClick={() => setTab('marketplace')} className="bg-white border border-[#e8eaf0] rounded-xl p-4 text-center hover:border-[#6366f1]/30 transition-colors relative">
                <div className="text-2xl mb-1">🛒</div>
                <p className="text-xs font-semibold text-[#1e2235]">{t('admin.marketplaceTab')}</p>
                {stats.disputedOrders > 0 && <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">{stats.disputedOrders}</span>}
              </button>
              <button onClick={() => setTab('announcements')} className="bg-white border border-[#e8eaf0] rounded-xl p-4 text-center hover:border-[#6366f1]/30 transition-colors">
                <div className="text-2xl mb-1">📢</div>
                <p className="text-xs font-semibold text-[#1e2235]">{t('admin.announcementsLabel')}</p>
              </button>
              <button onClick={() => setTab('comments')} className="bg-white border border-[#e8eaf0] rounded-xl p-4 text-center hover:border-[#6366f1]/30 transition-colors">
                <div className="text-2xl mb-1">💭</div>
                <p className="text-xs font-semibold text-[#1e2235]">{t('admin.viewComments')}</p>
              </button>
            </div>
          </div>
        )}

        {/* ===================== USERS ===================== */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder={t('admin.searchUsers')}
                className="flex-1 px-4 py-2.5 bg-white border border-[#e8eaf0] rounded-xl text-sm text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              {allUsers.length === 0 ? (
                <div className="bg-white border border-[#e8eaf0] rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-2 opacity-50">👥</div>
                  <p className="text-[#8b8fa6]">{t('admin.noUsersFound')}</p>
                </div>
              ) : allUsers.map(u => (
                <div key={u.id} className="bg-white border border-[#e8eaf0] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#6366f1]/10 flex items-center justify-center text-sm font-bold text-[#6366f1] shrink-0">
                      {(u.display_name || u.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1e2235] truncate">{u.display_name || u.username || 'Unknown'}</p>
                      <p className="text-xs text-[#8b8fa6]">@{u.username}{u.email ? ` · ${u.email}` : ''} · {u.id.slice(0, 8)}...</p>
                      {u.ban_reason && <p className="text-[10px] text-red-400 mt-0.5">🚫 {u.ban_reason}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                      {u.role}
                    </span>
                    {u.seller_status && u.seller_status !== 'none' && (
                      <span className="text-[10px] px-2 py-1 rounded-lg font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        {u.seller_status === 'verified' ? '🏪' : '⏳'}
                      </span>
                    )}
                    <select
                      value={u.role}
                      onChange={e => { adminAction({ action: 'updateRole', userId: u.id, role: e.target.value }); setAllUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: e.target.value } : x)) }}
                      disabled={actionLoading}
                      className="text-xs px-2 py-1 rounded-lg border border-[#e8eaf0] bg-[#f5f6fa] text-[#1e2235] focus:outline-none"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                      <option value="suspended">{t('admin.suspended')}</option>
                    </select>
                    {u.role !== 'suspended' ? (
                      <button onClick={() => {
                        const reason = prompt(t('admin.banReasonPrompt'))
                        if (reason) { adminAction({ action: 'suspendUser', userId: u.id, ban_reason: reason }); setAllUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: 'suspended', ban_reason: reason } : x)) }
                      }} className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" disabled={actionLoading}>
                        🚫
                      </button>
                    ) : (
                      <button onClick={() => { adminAction({ action: 'reactivateUser', userId: u.id }); setAllUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: 'user', ban_reason: undefined } : x)) }} className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors" disabled={actionLoading}>
                        ✅
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== SELLERS ===================== */}
        {tab === 'sellers' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'verified', 'rejected', 'suspended'].map(status => (
                <button
                  key={status}
                  onClick={() => setSellerFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    sellerFilter === status ? 'bg-[#6366f1] text-white' : 'bg-white border border-[#e8eaf0] text-[#5c6078] hover:border-[#6366f1]/30'
                  }`}
                >
                  {status === 'all' ? t('admin.all')
                    : status === 'pending' ? t('admin.pending')
                    : status === 'verified' ? t('admin.verified')
                    : status === 'rejected' ? t('admin.rejected')
                    : t('admin.suspended')}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {sellerApps.length === 0 ? (
                <div className="bg-white border border-[#e8eaf0] rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-2 opacity-50">🏪</div>
                  <p className="text-[#8b8fa6]">{t('admin.noSellers')}</p>
                </div>
              ) : sellerApps.map(app => (
                <div key={app.id} className="bg-white border border-[#e8eaf0] rounded-xl p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#1e2235]">{app.real_name}</h3>
                      <p className="text-xs text-[#8b8fa6]">@{app.profiles?.[0]?.username || 'Unknown'}{app.shop_name ? ` · ${app.shop_name}` : ''}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-semibold self-start sm:self-auto ${
                      app.status === 'pending' ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        : app.status === 'verified' ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : app.status === 'rejected' ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                        : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
                    }`}>
                      {app.status === 'pending' ? '⏳' : app.status === 'verified' ? '✅' : app.status === 'rejected' ? '❌' : '🚫'}
                      {' '}{app.status === 'pending' ? t('admin.pending')
                        : app.status === 'verified' ? t('admin.verified')
                        : app.status === 'rejected' ? t('admin.rejected')
                        : t('admin.suspended')}
                    </span>
                  </div>
                  {app.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => { adminAction({ action: 'approveSeller', sellerId: app.id }); setSellerApps(prev => prev.map(s => s.id === app.id ? { ...s, status: 'verified' } : s)) }} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors font-semibold" disabled={actionLoading}>
                        ✅ {t('admin.approve')}
                      </button>
                      <button onClick={() => { const reason = prompt(t('admin.rejectionReason')); if (reason) { adminAction({ action: 'rejectSeller', sellerId: app.id, reason }); setSellerApps(prev => prev.map(s => s.id === app.id ? { ...s, status: 'rejected' } : s)) }}} className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-semibold" disabled={actionLoading}>
                        ❌ {t('admin.reject')}
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-[#b5b8c8] mt-2">{app.id.slice(0, 12)}... · {new Date(app.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== MARKETPLACE ===================== */}
        {tab === 'marketplace' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setMarketplaceFilter('disputed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  marketplaceFilter === 'disputed' ? 'bg-red-500 text-white' : 'bg-white border border-[#e8eaf0] text-[#5c6078] hover:border-red-500/30'
                }`}
              >
                ⚠️ {t('admin.disputedOrders')} {stats && stats.disputedOrders > 0 && `(${stats.disputedOrders})`}
              </button>
              <button
                onClick={() => setMarketplaceFilter('listings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  marketplaceFilter === 'listings' ? 'bg-[#6366f1] text-white' : 'bg-white border border-[#e8eaf0] text-[#5c6078] hover:border-[#6366f1]/30'
                }`}
              >
                🛒 {t('admin.allListings')}
              </button>
            </div>

            {/* Disputed Orders */}
            {marketplaceFilter === 'disputed' && (
              <div className="space-y-2">
                {orders.length === 0 ? (
                  <div className="bg-white border border-[#e8eaf0] rounded-2xl p-8 text-center">
                    <div className="text-4xl mb-2 opacity-50">✅</div>
                    <p className="text-[#8b8fa6]">{t('admin.noDisputedOrders')}</p>
                  </div>
                ) : orders.map(o => (
                  <div key={o.id} className="bg-white border border-red-500/20 rounded-xl p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-[#1e2235]">{o.listing?.card_name || t('admin.unknownCard')}</h3>
                        <p className="text-xs text-[#8b8fa6]">
                          {t('admin.buyer')}: @{o.buyer?.username || '?'} → {t('admin.seller')}: @{o.seller?.username || '?'} · {formatPrice(o.price, o.currency)}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-lg font-semibold bg-red-500/15 text-red-500 border border-red-500/30 self-start sm:self-auto">
                        ⚠️ {t('admin.disputed')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { adminAction({ action: 'resolveOrder', orderId: o.id, resolution: 'completed' }); setOrders(prev => prev.filter(x => x.id !== o.id)) }} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors font-semibold" disabled={actionLoading}>
                        ✅ {t('admin.resolveCompleted')}
                      </button>
                      <button onClick={() => { adminAction({ action: 'resolveOrder', orderId: o.id, resolution: 'cancelled' }); setOrders(prev => prev.filter(x => x.id !== o.id)) }} className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-semibold" disabled={actionLoading}>
                        ❌ {t('admin.resolveCancelled')}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#b5b8c8] mt-2">{o.id.slice(0, 12)}... · {new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}

            {/* All Listings */}
            {marketplaceFilter === 'listings' && (
              <div className="space-y-2">
                {listings.length === 0 ? (
                  <div className="bg-white border border-[#e8eaf0] rounded-2xl p-8 text-center">
                    <div className="text-4xl mb-2 opacity-50">🛒</div>
                    <p className="text-[#8b8fa6]">{t('admin.noListings')}</p>
                  </div>
                ) : listings.map(l => (
                  <div key={l.id} className="bg-white border border-[#e8eaf0] rounded-xl p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#1e2235] truncate">{l.card_name}</h3>
                        <p className="text-xs text-[#8b8fa6]">
                          @{l.seller?.username || '?'} · {l.game} · {l.condition} · {formatPrice(l.price, l.currency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold ${l.is_active ? 'bg-emerald-500/15 text-emerald-500' : 'bg-gray-500/15 text-gray-400'}`}>
                          {l.is_active ? '● Active' : '○ Inactive'}
                        </span>
                        <button onClick={() => { adminAction({ action: 'toggleListing', listingId: l.id, isActive: !l.is_active }); setListings(prev => prev.map(x => x.id === l.id ? { ...x, is_active: !l.is_active } : x)) }} className="text-xs px-2 py-1 rounded-lg bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20 transition-colors font-semibold" disabled={actionLoading}>
                          {l.is_active ? t('admin.deactivate') : t('admin.activate')}
                        </button>
                        <button onClick={() => { if (confirm(t('admin.deleteListingConfirm'))) { adminAction({ action: 'deleteListing', listingId: l.id }); setListings(prev => prev.filter(x => x.id !== l.id)) }}} className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-semibold" disabled={actionLoading}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== THREADS ===================== */}
        {tab === 'threads' && (
          <div className="space-y-2">
            {recentThreads.length === 0 ? (
              <div className="bg-white border border-[#e8eaf0] rounded-2xl p-8 text-center">
                <div className="text-4xl mb-2 opacity-50">💬</div>
                <p className="text-[#8b8fa6]">{t('admin.noThreads')}</p>
              </div>
            ) : recentThreads.map(th => (
              <div key={th.id} className="bg-white border border-[#e8eaf0] rounded-xl p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {th.is_pinned && <span className="text-xs text-[#6366f1] font-semibold shrink-0">📌</span>}
                    <h3 className="text-sm font-semibold text-[#1e2235] truncate">{th.title}</h3>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { adminAction({ action: 'togglePin', threadId: th.id }); setRecentThreads(prev => prev.map(x => x.id === th.id ? { ...x, is_pinned: !x.is_pinned } : x)) }} className="px-3 py-1.5 text-xs rounded-lg bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20 transition-colors font-semibold" disabled={actionLoading}>
                      {th.is_pinned ? t('admin.unpin') : t('admin.pin')}
                    </button>
                    <button onClick={() => { if (confirm(t('admin.deleteThreadConfirm'))) { adminAction({ action: 'deleteThread', threadId: th.id }); setRecentThreads(prev => prev.filter(x => x.id !== th.id)) }}} className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-semibold" disabled={actionLoading}>
                      {t('admin.deleteThread')}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-[#8b8fa6] mt-1">{th.id.slice(0, 12)}... · {new Date(th.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* ===================== COMMENTS ===================== */}
        {tab === 'comments' && (
          <div className="space-y-2">
            {comments.length === 0 ? (
              <div className="bg-white border border-[#e8eaf0] rounded-2xl p-8 text-center">
                <div className="text-4xl mb-2 opacity-50">💭</div>
                <p className="text-[#8b8fa6]">{t('admin.noComments')}</p>
              </div>
            ) : comments.map(c => (
              <div key={c.id} className="bg-white border border-[#e8eaf0] rounded-xl p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#6366f1]">@{c.profiles?.username || 'unknown'}</span>
                      <span className="text-[10px] text-[#8b8fa6]">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-[#1e2235] line-clamp-2">{c.content}</p>
                  </div>
                  <button onClick={() => { if (confirm(t('admin.deleteCommentConfirm'))) { adminAction({ action: 'deleteReply', replyId: c.id }); setComments(prev => prev.filter(x => x.id !== c.id)) }}} className="px-2 py-1 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shrink-0" disabled={actionLoading}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===================== ANNOUNCEMENTS ===================== */}
        {tab === 'announcements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1e2235]">📢 {t('admin.announcementsLabel')}</h2>
              <button onClick={() => setShowAnnounceForm(!showAnnounceForm)} className="px-4 py-2 text-xs font-semibold bg-[#6366f1] text-white rounded-lg hover:bg-[#4f46e5] transition-colors">
                + {t('admin.newAnnouncement')}
              </button>
            </div>

            {showAnnounceForm && (
              <div className="bg-white border border-[#6366f1]/30 rounded-2xl p-4 sm:p-5">
                <h3 className="text-sm font-bold text-[#1e2235] mb-3">{t('admin.newAnnouncement')}</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={announceTitle}
                    onChange={e => setAnnounceTitle(e.target.value)}
                    placeholder={t('admin.announcementTitle')}
                    className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none"
                  />
                  <textarea
                    value={announceContent}
                    onChange={e => setAnnounceContent(e.target.value)}
                    placeholder={t('admin.announcementContent')}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none resize-none"
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select value={announcePriority} onChange={e => setAnnouncePriority(e.target.value)} className="px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] focus:border-[#6366f1] focus:outline-none">
                      <option value="low">{t('admin.low')}</option>
                      <option value="normal">{t('admin.normal')}</option>
                      <option value="high">{t('admin.high')}</option>
                      <option value="urgent">{t('admin.urgent')}</option>
                    </select>
                    <div className="flex gap-2 flex-1 justify-end">
                      <button onClick={() => setShowAnnounceForm(false)} className="px-4 py-2.5 text-xs font-semibold bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#5c6078] hover:text-[#1e2235]">
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={async () => {
                          if (!announceTitle.trim() || !announceContent.trim()) return
                          const success = await adminAction({ action: 'createAnnouncement', title: announceTitle, content: announceContent, priority: announcePriority })
                          if (success) { setAnnounceTitle(''); setAnnounceContent(''); setShowAnnounceForm(false); fetch('/api/admin?section=announcements', { headers: { 'Authorization': `Bearer ${user!.access_token}` } }).then(r => r.json()).then(d => setAnnouncements(d.announcements || [])) }
                        }}
                        disabled={actionLoading || !announceTitle.trim() || !announceContent.trim()}
                        className="px-4 py-2.5 text-xs font-semibold bg-[#6366f1] text-white rounded-xl hover:bg-[#4f46e5] transition-colors disabled:opacity-50"
                      >
                        {t('admin.publish')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {announcements.length === 0 ? (
                <div className="bg-white border border-[#e8eaf0] rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-2 opacity-50">📢</div>
                  <p className="text-[#8b8fa6]">{t('admin.noAnnouncements')}</p>
                </div>
              ) : announcements.map(a => (
                <div key={a.id} className="bg-white border border-[#e8eaf0] rounded-xl p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.normal}`}>
                          {a.priority === 'urgent' ? '🔴' : a.priority === 'high' ? '🟡' : a.priority === 'low' ? '🔵' : '⚪'} {a.priority.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-[#8b8fa6]">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#1e2235]">{a.title}</h3>
                      <p className="text-xs text-[#5c6078] mt-1 line-clamp-2">{a.content}</p>
                    </div>
                    <button onClick={() => { if (confirm(t('admin.deleteAnnouncementConfirm'))) { adminAction({ action: 'deleteAnnouncement', announcementId: a.id }); setAnnouncements(prev => prev.filter(x => x.id !== a.id)) }}} className="px-2 py-1 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shrink-0" disabled={actionLoading}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}