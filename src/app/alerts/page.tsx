'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/useAuth'
import { useT, useLocale } from '@/lib/i18n'

interface PriceAlert {
 id: string
 card_name: string
 game: string
 card_id: string
 target_price: number
 direction: 'below' | 'above'
 is_active: boolean
 triggered_at: string | null
 created_at: string
}

export default function PriceAlertsPage() {
 const { user } = useAuth()
 const t = useT()
 const { locale } = useLocale()

 const [alerts, setAlerts] = useState<PriceAlert[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 if (!user) { setLoading(false); return }
 fetch('/api/price-alerts', {
 headers: { 'Authorization': `Bearer ${user.access_token}` },
 })
 .then(r => r.json())
 .then(data => { setAlerts(data.alerts || []); setLoading(false) })
 .catch(() => setLoading(false))
 }, [user])

 const toggleAlert = async (id: string, isActive: boolean) => {
 if (!user) return
 const res = await fetch('/api/price-alerts', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
 body: JSON.stringify({ id, is_active: !isActive }),
 })
 if (res.ok) {
 setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: !isActive } : a))
 }
 }

 const deleteAlert = async (id: string) => {
 if (!user) return
 const res = await fetch(`/api/price-alerts?id=${id}`, {
 method: 'DELETE',
 headers: { 'Authorization': `Bearer ${user.access_token}` },
 })
 if (res.ok) {
 setAlerts(prev => prev.filter(a => a.id !== id))
 }
 }

 const getGameLabel = (game: string) => {
 if (game === 'pokemon') return 'Pokémon'
 if (game === 'pokemon-jp') return 'Pokémon JP'
 if (game === 'onepiece') return 'One Piece'
 return game
 }

 if (!user) {
 return (
 <div className="min-h-screen bg-[#fafbfc]">
 <Navbar />
 <div className="max-w-2xl mx-auto px-4 py-20 text-center">
 <div className="text-5xl mb-4 opacity-50">🔔</div>
 <h1 className="text-xl font-bold text-[#1e2235] mb-2">{t('alerts.signInRequired')}</h1>
 <a href="/login" className="inline-block mt-3 px-6 py-3 bg-[#6366f1] text-white font-bold rounded-xl">
 {t('common.signIn')}
 </a>
 </div>
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-[#fafbfc]">
 <Navbar />
 <div className="max-w-2xl mx-auto px-4 py-8">
 <div className="flex items-center gap-3 mb-6">
 <span className="text-2xl">🔔</span>
 <h1 className="text-2xl font-extrabold text-[#1e2235]">
 {t('alerts.title')}
 </h1>
 </div>

 <p className="text-sm text-[#5c6078] mb-6">
 {t('alerts.description')}
 </p>

 {loading ? (
 <div className="space-y-3">
 {[1,2,3].map(i => <div key={i} className="animate-pulse h-20 rounded-xl" />)}
 </div>
 ) : alerts.length === 0 ? (
 <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
 <div className="text-5xl mb-4 opacity-50">🔕</div>
 <h3 className="text-lg font-bold text-[#1e2235] mb-2">
 {t('alerts.noAlerts')}
 </h3>
 <p className="text-sm text-[#8b8fa6] mb-4">
 {t('alerts.noAlertsDescFull')}
 </p>
 <a href="/search" className="inline-block px-5 py-2 bg-[#6366f1] text-white font-bold rounded-xl text-sm">
 {t('alerts.searchCards')}
 </a>
 </div>
 ) : (
 <div className="space-y-3">
 {alerts.map(alert => (
 <div key={alert.id} className={`bg-white border rounded-2xl p-4 transition-all ${
 alert.is_active ? 'border-[#e8eaf0]' : 'border-[#e8eaf0] opacity-50'
 }`}>
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
 alert.direction === 'below' ? 'bg-emerald-50' : 'bg-red-50'
 }`}>
 {alert.direction === 'below' ? '📉' : '📈'}
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="text-sm font-bold text-[#1e2235] truncate">{alert.card_name}</h3>
 <div className="flex items-center gap-2 text-xs text-[#8b8fa6]">
 <span>{getGameLabel(alert.game)}</span>
 <span>·</span>
 <span>
 {alert.direction === 'below'
 ? t('alerts.below')
 : t('alerts.above')} ${alert.target_price.toFixed(2)}
 </span>
 {alert.triggered_at && (
 <>
 <span>·</span>
 <span className="text-[#6366f1] font-semibold">
 ✅ {t('alerts.triggered')}
 </span>
 </>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => toggleAlert(alert.id, alert.is_active)}
 className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
 alert.is_active
 ? 'bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20'
 : 'bg-[#fafbfc] text-[#8b8fa6] hover:bg-[#e8eaf0]'
 }`}
 >
 {alert.is_active ? t('alerts.on') : t('alerts.off')}
 </button>
 <button
 onClick={() => deleteAlert(alert.id)}
 className="px-2 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-xs"
 >
 ✕
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}

 <div className="mt-6 text-center">
 <a href="/search" className="text-sm text-[#6366f1] font-semibold hover:underline">
 + {t('alerts.addNewAlert')}
 </a>
 </div>
 </div>
 </div>
 )
}