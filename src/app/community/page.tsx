'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useT } from '@/lib/i18n'

interface Activity {
 id: string
 user_id: string
 action: string
 card_id: string
 game: string
 metadata: Record<string, unknown>
 created_at: string
 profiles?: { username: string; display_name: string; avatar_url: string | null }
}

interface LeaderboardEntry {
 user_id: string
 username: string
 display_name: string
 avatar_url: string | null
 total_cards: number
 total_value: number
}

interface TrendingCard {
 card_id: string
 game: string
 count: number
}

const ACTION_LABELS_TH: Record<string, string> = {
 added_to_collection: 'เพิ่มเข้าคอลเลกชัน',
 removed_from_collection: 'ลบออกจากคอลเลกชัน',
 added_to_wishlist: 'เพิ่มวิชลิสต์',
 posted_comment: 'แสดงความคิดเห็นที่',
 listed_for_trade: 'ตั้งขายแลกเปลี่ยน',
 followed_user: 'ติดตาม',
 updated_profile: 'อัปเดตโปรไฟล์',
}

const ACTION_LABELS_EN: Record<string, string> = {
 added_to_collection: 'added to collection',
 removed_from_collection: 'removed from collection',
 added_to_wishlist: 'added to wishlist',
 posted_comment: 'commented on',
 listed_for_trade: 'listed for trade',
 followed_user: 'followed',
 updated_profile: 'updated profile',
}

const GAME_COLORS: Record<string, string> = {
 pokemon: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
 onepiece: 'bg-red-500/10 text-red-400 border-red-500/20',
 'pokemon-jp': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
}

const GAME_LABELS: Record<string, string> = {
 pokemon: 'Pokemon',
 onepiece: 'One Piece',
 'pokemon-jp': 'Pokemon JP',
}

export default function CommunityPage() {
 const t = useT()
 const [tab, setTab] = useState<'feed' | 'leaderboard' | 'trending'>('feed')
 const [activities, setActivities] = useState<Activity[]>([])
 const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
 const [trending, setTrending] = useState<TrendingCard[]>([])
 const [loading, setLoading] = useState(true)

 const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
 const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

 useEffect(() => {
 if (tab === 'feed') fetchActivities()
 else if (tab === 'leaderboard') fetchLeaderboard()
 else if (tab === 'trending') fetchTrending()
 }, [tab])

 async function fetchActivities() {
 setLoading(true)
 try {
 const res = await fetch(`${SUPABASE_URL}/rest/v1/activities?select=*,profiles(username,display_name,avatar_url)&order=created_at.desc&limit=30`, {
 headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
 })
 if (res.ok) { const data = await res.json(); setActivities(data || []) }
 } catch { /* ignore */ }
 setLoading(false)
 }

 async function fetchLeaderboard() {
 setLoading(true)
 try {
 const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,username,display_name,avatar_url,is_public,collection_public&is_public=eq.true&order=username&limit=20`, {
 headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
 })
 if (res.ok) {
 const data = await res.json()
 // Count collections per user
 const entries = await Promise.all((data || []).map(async (p: any) => {
 const cRes = await fetch(`${SUPABASE_URL}/rest/v1/collections?select=id&user_id=eq.${p.id}`, {
 headers: { 'apikey': SUPABASE_ANON_KEY },
 })
 const cards = cRes.ok ? await cRes.json() : []
 return { ...p, total_cards: cards.length, total_value: 0 }
 }))
 setLeaderboard(entries.filter((e: any) => e.total_cards > 0).sort((a: any, b: any) => b.total_cards - a.total_cards))
 }
 } catch { /* ignore */ }
 setLoading(false)
 }

 async function fetchTrending() {
 setLoading(true)
 try {
 const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
 const res = await fetch(`${SUPABASE_URL}/rest/v1/activities?select=card_id,game&action=eq.added_to_collection&created_at=gte.${sevenDaysAgo}&order=created_at.desc&limit=100`, {
 headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
 })
 if (res.ok) {
 const data = await res.json()
 const cardCounts: Record<string, TrendingCard> = {}
 for (const a of data || []) {
 const key = `${a.card_id}_${a.game}`
 if (!cardCounts[key]) cardCounts[key] = { card_id: a.card_id, game: a.game, count: 0 }
 cardCounts[key].count++
 }
 setTrending(Object.values(cardCounts).sort((a, b) => b.count - a.count).slice(0, 20))
 }
 } catch { /* ignore */ }
 setLoading(false)
 }

 function timeAgo(dateStr: string): string {
 const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
 if (seconds < 60) return t('common.ago') === 'ที่แล้ว' ? 'เมื่อสักครู่' : 'just now'
 const mins = Math.floor(seconds / 60)
 if (mins < 60) return `${mins}m ${t('common.ago')}`
 const hours = Math.floor(mins / 60)
 if (hours < 24) return `${hours}h ${t('common.ago')}`
 const days = Math.floor(hours / 24)
 return `${days}d ${t('common.ago')}`
 }

 function getActionLabel(action: string): string {
 const isTh = t('common.ago') === 'ที่แล้ว'
 return isTh ? (ACTION_LABELS_TH[action] || action) : (ACTION_LABELS_EN[action] || action)
 }

 function getCardLink(cardId: string, game: string): string {
 if (game === 'pokemon') return `/card/pokemon/${cardId}`
 if (game === 'onepiece') return `/card/onepiece/${encodeURIComponent(cardId)}`
 if (game === 'pokemon-jp') return `/card/pokemon-jp/${encodeURIComponent(cardId)}`
 return '#'
 }

 const tabs = [
 { key: 'feed' as const, label: t('community.activity'), icon: '📡' },
 { key: 'leaderboard' as const, label: t('community.leaderboard'), icon: '🏆' },
 { key: 'trending' as const, label: t('community.trending'), icon: '🔥' },
 ]

 return (
 <div className="min-h-screen" style={{ background: 'var(--background)' }}>
 <Navbar />

 <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 <div className="text-center mb-10">
 <h1 className="text-4xl font-extrabold text-[#1e2235] tracking-tight mb-3">
 {t('nav.community')}
 </h1>
 <p className="text-[#5c6078] text-lg">
 {t('community.joinDesc')}
 </p>
 </div>

 {/* Quick Links */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
 <Link href="/discussions" className="bg-white border border-[#e8eaf0] rounded-2xl p-5 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all group text-center">
 <div className="text-3xl mb-2">💬</div>
 <h3 className="text-sm font-bold text-[#1e2235] group-hover:text-[#6366f1] transition-colors">{t('community.discussCta')}</h3>
 <p className="text-xs text-[#8b8fa6] mt-1">{t('community.discussDesc')}</p>
 </Link>
 <Link href="/trades" className="bg-white border border-[#e8eaf0] rounded-2xl p-5 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all group text-center">
 <div className="text-3xl mb-2">🤝</div>
 <h3 className="text-sm font-bold text-[#1e2235] group-hover:text-[#6366f1] transition-colors">{t('community.tradeCta')}</h3>
 <p className="text-xs text-[#8b8fa6] mt-1">{t('community.tradeDesc')}</p>
 </Link>
 <Link href="/badges" className="bg-white border border-[#e8eaf0] rounded-2xl p-5 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all group text-center">
 <div className="text-3xl mb-2">🏅</div>
 <h3 className="text-sm font-bold text-[#1e2235] group-hover:text-[#6366f1] transition-colors">{t('community.badgeCta')}</h3>
 <p className="text-xs text-[#8b8fa6] mt-1">{t('community.badgeDesc')}</p>
 </Link>
 </div>

 {/* Tabs */}
 <div className="flex gap-1 bg-[#fafbfc] border border-[#e8eaf0] rounded-xl p-1 mb-8 max-w-md mx-auto">
 {tabs.map(tb => (
 <button
 key={tb.key}
 onClick={() => setTab(tb.key)}
 className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
 tab === tb.key
 ? 'bg-[#6366f1] text-[#1e2235]'
 : 'text-[#5c6078] hover:text-[#1e2235]'
 }`}
 >
 <span className="mr-1.5">{tb.icon}</span>
 {tb.label}
 </button>
 ))}
 </div>

 {loading ? (
 <div className="text-center py-16">
 <div className="text-4xl mb-4 animate-pulse">⏳</div>
 <p className="text-[#8b8fa6]">{t('common.loading')}</p>
 </div>
 ) : tab === 'feed' ? (
 activities.length === 0 ? (
 <div className="text-center py-16">
 <div className="text-5xl mb-4">📡</div>
 <p className="text-[#5c6078] text-lg mb-2">{t('community.noActivity')}</p>
 <p className="text-[#8b8fa6] text-sm mb-6">{t('community.noActivityDesc')}</p>
 <Link href="/search" className="inline-block px-6 py-3 bg-[#6366f1] text-[#1e2235] font-bold rounded-xl hover:bg-[#4f46e5] transition-all">
 {t('common.searchCards')}
 </Link>
 </div>
 ) : (
 <div className="space-y-3">
 {activities.map(a => (
 <div key={a.id} className="bg-white border border-[#e8eaf0] rounded-xl p-4 flex items-start gap-3 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all">
 <div className="w-10 h-10 bg-[#fafbfc] border border-[#e8eaf0] rounded-full flex items-center justify-center text-lg flex-shrink-0">
 {a.profiles?.avatar_url ? <img src={a.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : '👤'}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-sm font-bold text-[#1e2235]">{a.profiles?.display_name || a.profiles?.username || 'Collector'}</span>
 <span className="text-xs text-[#8b8fa6]">{getActionLabel(a.action)}</span>
 {a.card_id && a.game && (
 <Link href={getCardLink(a.card_id, a.game)} className="text-xs text-[#6366f1] hover:underline">
 {(a.metadata as any)?.card_name || a.card_id.slice(0, 20)}
 </Link>
 )}
 {a.game && <span className={`text-[10px] px-1.5 py-0.5 rounded border ${GAME_COLORS[a.game] || ''}`}>{GAME_LABELS[a.game] || a.game}</span>}
 </div>
 <p className="text-xs text-[#b5b8c8] mt-1">{timeAgo(a.created_at)}</p>
 </div>
 </div>
 ))}
 </div>
 )
 ) : tab === 'leaderboard' ? (
 leaderboard.length === 0 ? (
 <div className="text-center py-16">
 <div className="text-5xl mb-4">🏆</div>
 <p className="text-[#5c6078] text-lg mb-2">{t('community.noLeaders')}</p>
 <p className="text-[#8b8fa6] text-sm mb-6">{t('community.noLeadersDesc')}</p>
 <Link href="/collection" className="inline-block px-6 py-3 bg-[#6366f1] text-[#1e2235] font-bold rounded-xl hover:bg-[#4f46e5] transition-all">
 {t('home.hero.cta')}
 </Link>
 </div>
 ) : (
 <div className="space-y-3">
 {leaderboard.map((entry, i) => (
 <div key={entry.user_id} className="bg-white border border-[#e8eaf0] rounded-xl p-4 flex items-center gap-4 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
 i === 0 ? 'bg-[#6366f1]/20 text-[#6366f1] border-2 border-amber-500' :
 i === 1 ? 'bg-gray-400/20 text-[#3b3f56] border border-[#e8eaf0]' :
 i === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500' :
 'bg-[#fafbfc] text-[#8b8fa6] border border-[#e8eaf0]'
 }`}>
 {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-bold text-[#1e2235] truncate">{entry.display_name || entry.username || 'Collector'}</p>
 </div>
 <div className="text-right">
 <p className="text-sm font-bold text-[#6366f1]">{entry.total_cards} {t('common.cards')}</p>
 </div>
 </div>
 ))}
 </div>
 )
 ) : (
 trending.length === 0 ? (
 <div className="text-center py-16">
 <div className="text-5xl mb-4">🔥</div>
 <p className="text-[#5c6078] text-lg mb-2">{t('community.noTrending')}</p>
 <p className="text-[#8b8fa6] text-sm mb-6">{t('community.noTrendingDesc')}</p>
 <Link href="/search" className="inline-block px-6 py-3 bg-[#6366f1] text-[#1e2235] font-bold rounded-xl hover:bg-[#4f46e5] transition-all">
 {t('common.searchCards')}
 </Link>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {trending.map((card, i) => (
 <Link key={`${card.card_id}_${card.game}`} href={getCardLink(card.card_id, card.game)} className="bg-white border border-[#e8eaf0] rounded-xl p-5 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all group">
 <div className="flex items-center justify-between mb-3">
 <span className={`text-xs px-2 py-0.5 rounded border ${GAME_COLORS[card.game] || ''}`}>{GAME_LABELS[card.game] || card.game}</span>
 <span className="text-2xl font-extrabold text-[#6366f1]">#{i + 1}</span>
 </div>
 <p className="text-sm text-[#1e2235] truncate group-hover:text-[#6366f1] transition-colors">{card.card_id}</p>
 <p className="text-xs text-[#8b8fa6] mt-1">{card.count} collector{card.count > 1 ? 's' : ''}</p>
 </Link>
 ))}
 </div>
 )
 )}

 {/* CTA */}
 <div className="mt-12 text-center">
 <div className="bg-[#fafbfc] border border-[#e8eaf0] rounded-2xl p-8 max-w-lg mx-auto">
 <h3 className="text-xl font-bold text-[#1e2235] mb-2">{t('community.joinCta')}</h3>
 <p className="text-[#8b8fa6] text-sm mb-6">{t('community.joinDesc')}</p>
 <Link href="/login" className="inline-block px-6 py-3 bg-[#6366f1] text-[#1e2235] font-bold rounded-xl hover:bg-[#4f46e5] transition-all">
 {t('community.getStarted')}
 </Link>
 </div>
 </div>
 </div>
 </div>
 )
}