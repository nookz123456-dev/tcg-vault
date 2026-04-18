'use client'

import { useLocalCollection } from '@/lib/useLocalCollection'
import { useAuth } from '@/lib/useAuth'
import { CONDITION_LABELS, GAME_LABELS } from '@/lib/api'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useT } from '@/lib/i18n'

export default function CollectionPage() {
 const { cards, isLoaded, removeCard, updateCard, totalValue, totalInvested, totalCards } = useLocalCollection()
 const t = useT()
 const { user, isGuest, isAuthenticated, loading: authLoading } = useAuth()

 const profitLoss = totalValue - totalInvested
 const profitPct = totalInvested > 0 ? ((profitLoss / totalInvested) * 100) : 0

 if (authLoading || !isLoaded) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
 <div className="text-[#8b8fa6]">{t('common.loading') || 'Loading...'}</div>
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-[#fafbfc]">
 <Navbar />

 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 <div className="flex items-center justify-between mb-2">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1e2235] tracking-tight">{t('collection.title') || 'My Collection'}</h1>
 {user && (
 <a href={`/u/${user.email?.split('@')[0] || ''}`} className="text-xs text-[#6366f1] hover:text-[#4f46e5] font-medium">{t('collection.viewProfile') || 'View Profile →'}</a>
 )}
 </div>
 <div className="flex items-center gap-3">
 {isGuest && (
 <span className="text-xs px-2.5 py-1 bg-[#6366f1]/10 text-[#6366f1] rounded-lg font-semibold">
 Guest Mode
 </span>
 )}
 {user && (
 <button
 onClick={async () => {
 try {
 const res = await fetch('/api/profiles', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
 body: JSON.stringify({ collection_public: true }),
 })
 if (res.ok) alert('Collection is now public!')
 } catch { /* ignore */ }
 }}
 className="text-xs px-3 py-1.5 bg-white border border-[#e8eaf0] rounded-lg text-[#5c6078] hover:text-[#6366f1] hover:border-[#6366f1]/30 transition-all font-medium"
 >{t('collection.makePublic') || 'Make Public'}</button>
 )}
 </div>
 </div>
 <p className="text-sm text-[#8b8fa6] mb-8">
 {isGuest ? t('collection.guestDesc') || 'Data saved locally. Sign in to sync.' : t('collection.userDesc') || 'Track and manage your card portfolio'}
 </p>

 {/* Stats */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
 <div className="bg-white border border-[#e8eaf0] rounded-xl p-4 shadow-sm">
 <p className="text-xs text-[#8b8fa6] mb-1">{t('collection.totalCards') || 'Total Cards'}</p>
 <p className="text-2xl font-extrabold text-[#1e2235]">{totalCards}</p>
 </div>
 <div className="bg-white border border-[#e8eaf0] rounded-xl p-4 shadow-sm">
 <p className="text-xs text-[#8b8fa6] mb-1">{t('collection.value') || 'Collection Value'}</p>
 <p className="text-2xl font-extrabold text-[#6366f1]">${totalValue.toFixed(2)}</p>
 </div>
 <div className="bg-white border border-[#e8eaf0] rounded-xl p-4 shadow-sm">
 <p className="text-xs text-[#8b8fa6] mb-1">{t('collection.invested') || 'Total Invested'}</p>
 <p className="text-2xl font-extrabold text-[#3b3f56]">${totalInvested.toFixed(2)}</p>
 </div>
 <div className="bg-white border border-[#e8eaf0] rounded-xl p-4 shadow-sm">
 <p className="text-xs text-[#8b8fa6] mb-1">{t('collection.profitLoss') || 'Profit/Loss'}</p>
 <p className={`text-2xl font-extrabold ${profitLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
 {profitLoss >= 0 ? '+' : ''}{profitLoss.toFixed(2)}
 {totalInvested > 0 && <span className="text-sm ml-1">({profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%)</span>}
 </p>
 </div>
 </div>

 {/* Card list */}
 {cards.length === 0 ? (
 <div className="text-center py-16">
 <div className="text-5xl mb-4">📦</div>
 <p className="text-[#1e2235] text-lg font-bold mb-2">{t('collection.empty') || 'Your collection is empty'}</p>
 <p className="text-[#8b8fa6] text-sm mb-6">{t('collection.emptyDesc') || 'Start by searching for cards'}</p>
 <Link href="/search" className="inline-block px-6 py-3 bg-[#6366f1] text-white font-semibold rounded-xl hover:bg-[#4f46e5] transition-all"
 >
 Search Cards →
 </Link>
 </div>
 ) : (
 <div className="space-y-3">
 {cards.map((card) => (
 <div key={card.id} className="bg-white border border-[#e8eaf0] rounded-xl p-4 flex items-center gap-4 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all shadow-sm">
 <img src={card.imageUrl} alt={card.name} className="w-16 h-22 object-contain rounded" />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <h3 className="text-sm font-bold text-[#1e2235] truncate">{card.name}</h3>
 <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${card.game === 'pokemon' ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'bg-rose-50 text-rose-500'}`}>
 {GAME_LABELS[card.game as keyof typeof GAME_LABELS]}
 </span>
 </div>
 <p className="text-xs text-[#8b8fa6] truncate">{card.setName}</p>
 {card.rarity && <p className="text-xs text-[#6366f1] font-medium">{card.rarity}</p>}
 </div>
 <div className="text-center hidden sm:block">
 <p className="text-[10px] text-[#b5b8c8]">{t('collection.condition') || 'Condition'}</p>
 <p className="text-xs text-[#3b3f56]">{CONDITION_LABELS[card.condition] || card.condition}</p>
 </div>
 <div className="text-center">
 <p className="text-[10px] text-[#b5b8c8]">Qty</p>
 <div className="flex items-center gap-1">
 <button onClick={() => card.quantity > 1 && updateCard(card.id, { quantity: card.quantity - 1 })} className="w-6 h-6 bg-[#fafbfc] rounded text-[#8b8fa6] hover:text-[#1e2235] text-xs border border-[#e8eaf0]">-</button>
 <span className="text-sm text-[#1e2235] font-bold w-6 text-center">{card.quantity}</span>
 <button onClick={() => updateCard(card.id, { quantity: card.quantity + 1 })} className="w-6 h-6 bg-[#fafbfc] rounded text-[#8b8fa6] hover:text-[#1e2235] text-xs border border-[#e8eaf0]">+</button>
 </div>
 </div>
 <div className="text-right hidden sm:block">
 {card.marketPrice && (<><p className="text-[10px] text-[#b5b8c8]">{t('collection.market') || 'Market'}</p><p className="text-sm font-extrabold text-[#6366f1]">${card.marketPrice.toFixed(2)}</p></>)}
 {card.purchasePrice && (<><p className="text-[10px] text-[#b5b8c8]">{t('collection.paid') || 'Paid'}</p><p className="text-xs text-[#8b8fa6]">${card.purchasePrice.toFixed(2)}</p></>)}
 </div>
 <div className="text-right">
 <p className="text-[10px] text-[#b5b8c8]">{t('collection.total') || 'Total'}</p>
 <p className="text-sm font-extrabold text-[#1e2235]">${((card.marketPrice || card.purchasePrice || 0) * card.quantity).toFixed(2)}</p>
 </div>
 <button onClick={() => { if (confirm(t('collection.removeConfirm') || 'Remove this card?')) removeCard(card.id) }} className="w-8 h-8 flex items-center justify-center text-[#b5b8c8] hover:text-red-500 transition-colors">✕</button>
 </div>
 ))}
 </div>
 )}

 {cards.length > 0 && (
 <div className="mt-8 text-center">
 <Link href="/search" className="inline-block px-6 py-3 bg-white border border-[#e8eaf0] text-[#5c6078] font-semibold rounded-xl hover:text-[#6366f1] hover:border-[#6366f1]/30 transition-colors mr-4">
 + Add More Cards
 </Link>
 </div>
 )}
 </div>
 </div>
 )
}