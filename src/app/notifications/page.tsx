'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/useAuth'
import { useT } from '@/lib/i18n'

interface Notification {
 id: string
 type: string
 message: string
 is_read: boolean
 created_at: string
 actor: { username: string; avatar_url: string | null } | null
}

const TYPE_ICONS: Record<string, string> = {
 follow: '👤',
 comment_on_card: '💬',
 comment_on_thread: '💬',
 reply_to_thread: '↩️',
 wishlist_match: '💭',
 trade_offer: '🤝',
 badge_earned: '🏅',
 trade_completed: '✅',
}

export default function NotificationsPage() {
 const { user } = useAuth()
 const t = useT()
 const [notifications, setNotifications] = useState<Notification[]>([])
 const [unreadCount, setUnreadCount] = useState(0)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 if (!user) { setLoading(false); return }
 fetch('/api/notifications', {
 headers: { 'Authorization': `Bearer ${user.access_token}` },
 })
 .then(r => r.json())
 .then(data => {
 setNotifications(data.notifications || [])
 setUnreadCount(data.unread_count || 0)
 setLoading(false)
 })
 .catch(() => setLoading(false))
 }, [user])

 const markAllRead = async () => {
 if (!user) return
 await fetch('/api/notifications', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
 body: JSON.stringify({ mark_all_read: true }),
 })
 setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
 setUnreadCount(0)
 }

 const timeAgo = (dateStr: string) => {
 const diff = Date.now() - new Date(dateStr).getTime()
 const mins = Math.floor(diff / 60000)
 if (mins < 60) return `${mins}m ${t('common.ago')}`
 const hours = Math.floor(mins / 60)
 if (hours < 24) return `${hours}h ${t('common.ago')}`
 const days = Math.floor(hours / 24)
 return `${days}d ${t('common.ago')}`
 }

 if (!user) {
 return (
 <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
 <Navbar />
 <div className="text-center">
 <p className="text-[#8b8fa6]">{t('notif.signIn')}</p>
 <a href="/login" className="inline-block mt-3 px-5 py-2 bg-[#6366f1] text-[#1e2235] rounded-xl text-sm font-bold hover:bg-[#4f46e5]">{t('common.signIn')}</a>
 </div>
 </div>
 )
 }

 return (
 <div className="min-h-screen" style={{ background: 'var(--background)' }}>
 <Navbar />
 <div className="max-w-2xl mx-auto px-4 py-8">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1e2235]">{t('notif.title')}</h1>
 {unreadCount > 0 && (
 <p className="text-sm text-[#6366f1] mt-1">{unreadCount} {t('notif.unread')}</p>
 )}
 </div>
 {unreadCount > 0 && (
 <button
 onClick={markAllRead}
 className="px-4 py-2 text-xs font-semibold text-[#6366f1] hover:text-[#4f46e5] transition-colors"
 >
 {t('notif.markAllRead')}
 </button>
 )}
 </div>

 {loading ? (
 <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse h-16 rounded-xl" />)}</div>
 ) : notifications.length === 0 ? (
 <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
 <div className="text-5xl mb-4 opacity-50">🔔</div>
 <p className="text-[#5c6078] text-lg mb-1">{t('notif.none')}</p>
 <p className="text-[#b5b8c8] text-xs">{t('notif.noneDesc')}</p>
 </div>
 ) : (
 <div className="space-y-2">
 {notifications.map(n => (
 <div
 key={n.id}
 className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
 n.is_read ? 'bg-white border-[#e8eaf0]' : 'bg-[#6366f1]/5 border-[#6366f1]/20'
 }`}
 >
 <div className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</div>
 <div className="flex-1 min-w-0">
 <p className={`text-sm leading-relaxed ${n.is_read ? 'text-[#5c6078]' : 'text-[#1e2235] font-medium'}`}>
 {n.actor && (
 <a href={`/u/${n.actor.username || ''}`} className="text-[#6366f1] hover:text-[#4f46e5] font-semibold">
 {n.actor.username}
 </a>
 )}{' '}
 {n.message}
 </p>
 <p className="text-[10px] text-[#b5b8c8] mt-1">{timeAgo(n.created_at)}</p>
 </div>
 {!n.is_read && <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-2" />}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )
}