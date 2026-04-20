'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/useAuth'
import { useT } from '@/lib/i18n'

interface TradeOffer {
 id: string
 from_user_id: string
 to_user_id: string
 offered_card_id: string
 offered_game: string
 offered_condition: string
 requested_card_id: string
 requested_game: string
 requested_condition: string
 status: string
 message: string | null
 created_at: string
 from_user: { username: string; avatar_url: string | null }
 to_user: { username: string; avatar_url: string | null }
}

const STATUS_COLORS: Record<string, string> = {
 pending: 'bg-[#6366f1]/15 text-[#6366f1]',
 accepted: 'bg-emerald-50 text-emerald-500',
 rejected: 'bg-red-500/15 text-red-400',
 cancelled: 'bg-[#e8eaf0] text-[#8b8fa6]',
 completed: 'bg-blue-500/15 text-blue-400',
}

const STATUS_LABELS: Record<string, { th: string; en: string }> = {
 pending: { th: 'รอดำเนินการ', en: 'Pending' },
 accepted: { th: 'ยอมรับแล้ว', en: 'Accepted' },
 rejected: { th: 'ปฏิเสธ', en: 'Rejected' },
 cancelled: { th: 'ยกเลิก', en: 'Cancelled' },
 completed: { th: 'เสร็จสมบูรณ์', en: 'Completed' },
}

const GAME_LABELS: Record<string, string> = {
 pokemon: 'Pokemon',
 onepiece: 'One Piece',
 'pokemon-jp': 'Pokemon JP',
}

export default function TradesPage() {
 const { user } = useAuth()
 const t = useT()
 const [offers, setOffers] = useState<TradeOffer[]>([])
 const [loading, setLoading] = useState(true)
 const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all')

 useEffect(() => {
 if (!user) { setLoading(false); return }
 fetch(`/api/trades?status=${filter}`, {
 headers: { 'Authorization': `Bearer ${user.access_token}` },
 })
 .then(r => r.json())
 .then(data => {
 setOffers(data.offers || [])
 setLoading(false)
 })
 .catch(() => setLoading(false))
 }, [user, filter])

 const updateOfferStatus = async (offerId: string, status: string) => {
 if (!user) return
 await fetch('/api/trades', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
 body: JSON.stringify({ offer_id: offerId, status }),
 })
 setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status } : o))
 }


 if (!user) {
 return (
 <div className="min-h-screen" style={{ background: 'var(--background)' }}>
 <Navbar />
 <div className="max-w-4xl mx-auto px-4 py-20 text-center">
 <p className="text-[#8b8fa6]">{t('trades.signIn')}</p>
 <a href="/login" className="inline-block mt-3 px-5 py-2 bg-[#6366f1] text-[#1e2235] rounded-xl text-sm font-bold hover:bg-[#4f46e5]">{t('common.signIn')}</a>
 </div>
 </div>
 )
 }

 return (
 <div className="min-h-screen" style={{ background: 'var(--background)' }}>
 <Navbar />
 <div className="max-w-4xl mx-auto px-4 py-8">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1e2235]">{t('trades.title')}</h1>
 <p className="text-sm text-[#8b8fa6] mt-1">{t('trades.subtitle')}</p>
 </div>
 </div>

 {/* Filter tabs */}
 <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
 {(['all', 'pending', 'accepted', 'completed'] as const).map(f => (
 <button
 key={f}
 onClick={() => setFilter(f)}
 className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
 filter === f ? 'bg-[#6366f1] text-[#1e2235]' : 'bg-[#fafbfc] text-[#5c6078] border border-[#e8eaf0] hover:text-[#1e2235]'
 }`}
 >
 {t(`trades.status.${f}` as any) || (f.charAt(0).toUpperCase() + f.slice(1))}
 </button>
 ))}
 </div>

 {loading ? (
 <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="animate-pulse h-28 rounded-2xl" />)}</div>
 ) : offers.length === 0 ? (
 <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
 <div className="text-5xl mb-4 opacity-50">🤝</div>
 <h3 className="text-lg font-bold text-[#1e2235] mb-2">{t('trades.noTrades')}</h3>
 <p className="text-[#8b8fa6] text-sm">{t('trades.noTradesDesc')}</p>
 </div>
 ) : (
 <div className="space-y-3">
 {offers.map(offer => {
 const isIncoming = offer.to_user_id === user.id
 const otherUser = isIncoming ? offer.from_user : offer.to_user

 return (
 <div key={offer.id} className="bg-white border border-[#e8eaf0] rounded-2xl p-5">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${STATUS_COLORS[offer.status] || ''}`}>
 {t(`trades.status.${offer.status}` as any) || offer.status}
 </span>
 <span className="text-xs text-[#8b8fa6]">
 {t('common.from')}{' '}
 <a href={`/u/${otherUser?.username || ''}`} className="text-[#6366f1] hover:text-[#4f46e5] font-semibold">
 {otherUser?.username || 'Unknown'}
 </a>
 </span>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
 <div className="bg-[#fafbfc] rounded-xl p-3 border border-[#e8eaf0]">
 <p className="text-[10px] text-[#b5b8c8] uppercase tracking-wider mb-1">{t('trades.offered')}</p>
 <p className="text-sm font-semibold text-[#1e2235]">{offer.offered_card_id}</p>
 <p className="text-xs text-[#6366f1]">{GAME_LABELS[offer.offered_game] || offer.offered_game}</p>
 <p className="text-[10px] text-[#8b8fa6]">{offer.offered_condition}</p>
 </div>
 <div className="bg-[#fafbfc] rounded-xl p-3 border border-[#e8eaf0]">
 <p className="text-[10px] text-[#b5b8c8] uppercase tracking-wider mb-1">{t('trades.requested')}</p>
 <p className="text-sm font-semibold text-[#1e2235]">{offer.requested_card_id}</p>
 <p className="text-xs text-[#6366f1]">{GAME_LABELS[offer.requested_game] || offer.requested_game}</p>
 <p className="text-[10px] text-[#8b8fa6]">{offer.requested_condition}</p>
 </div>
 </div>

 {offer.message && (
 <p className="text-xs text-[#5c6078] bg-[#fafbfc] rounded-lg p-3 mb-3 italic">&ldquo;{offer.message}&rdquo;</p>
 )}

 {offer.status === 'pending' && (
 <div className="flex gap-2">
 {isIncoming && (
 <>
 <button onClick={() => updateOfferStatus(offer.id, 'accepted')} className="px-4 py-2 bg-emerald-500 text-[#1e2235] rounded-lg text-xs font-bold hover:bg-emerald-400 transition-all">
 {t('trades.accept')}
 </button>
 <button onClick={() => updateOfferStatus(offer.id, 'rejected')} className="px-4 py-2 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold hover:bg-red-500/25 transition-all">
 {t('trades.reject')}
 </button>
 </>
 )}
 {!isIncoming && (
 <button onClick={() => updateOfferStatus(offer.id, 'cancelled')} className="px-4 py-2 bg-[#fafbfc] text-[#8b8fa6] border border-[#e8eaf0] rounded-lg text-xs font-semibold hover:text-[#1e2235] transition-all">
 {t('trades.cancelOffer')}
 </button>
 )}
 </div>
 )}

 {offer.status === 'accepted' && (
 <button onClick={() => updateOfferStatus(offer.id, 'completed')} className="px-4 py-2 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold hover:bg-blue-500/25 transition-all">
 {t('trades.markCompleted')}
 </button>
 )}
 </div>
 )
 })}
 </div>
 )}
 </div>
 </div>
 )
}