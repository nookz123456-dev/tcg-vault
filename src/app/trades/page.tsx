'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/useAuth'

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
  pending: 'bg-amber-500/15 text-amber-400',
  accepted: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
  cancelled: 'bg-[var(--surface-2)] text-[var(--warm-400)]',
  completed: 'bg-blue-500/15 text-blue-400',
}

const GAME_LABELS: Record<string, string> = {
  pokemon: 'Pokemon',
  onepiece: 'One Piece',
  'pokemon-jp': 'Pokemon JP',
}

export default function TradesPage() {
  const { user } = useAuth()
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
    setOffers(prev => prev.filter(o => o.id !== offerId || true).map(o => o.id === offerId ? { ...o, status } : o))
  }

  if (!user) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-[var(--warm-400)]">Sign in to access trades</p>
          <a href="/login" className="inline-block mt-3 px-5 py-2 bg-amber-500 text-[var(--warm-900)] rounded-xl text-sm font-bold hover:bg-amber-400">Sign In</a>
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
            <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Trade Center</h1>
            <p className="text-sm text-[var(--warm-400)] mt-1">Manage your trade offers</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {(['all', 'pending', 'accepted', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
                filter === f ? 'bg-amber-500 text-[var(--warm-900)]' : 'bg-[var(--surface-1)] text-[var(--warm-300)] border border-[var(--card-border)] hover:text-[var(--foreground)]'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="shimmer h-28 rounded-2xl" />)}</div>
        ) : offers.length === 0 ? (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4 opacity-50">🤝</div>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">No trades yet</h3>
            <p className="text-[var(--warm-400)] text-sm">When you send or receive trade offers, they will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map(offer => {
              const isIncoming = offer.to_user_id === user.id
              const otherUser = isIncoming ? offer.from_user : offer.to_user

              return (
                <div key={offer.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${STATUS_COLORS[offer.status] || ''}`}>
                        {offer.status}
                      </span>
                      <span className="text-xs text-[var(--warm-400)]">
                        {isIncoming ? 'from' : 'to'}{' '}
                        <a href={`/u/${otherUser?.username || ''}`} className="text-amber-400 hover:text-amber-300 font-semibold">
                          {otherUser?.username || 'Unknown'}
                        </a>
                      </span>
                    </div>
                  </div>

                  {/* Trade cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {/* Offered card */}
                    <div className="bg-[var(--surface-1)] rounded-xl p-3 border border-[var(--card-border)]">
                      <p className="text-[10px] text-[var(--warm-500)] uppercase tracking-wider mb-1">Offered</p>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{offer.offered_card_id}</p>
                      <p className="text-xs text-amber-400">{GAME_LABELS[offer.offered_game] || offer.offered_game}</p>
                      <p className="text-[10px] text-[var(--warm-400)]">{offer.offered_condition}</p>
                    </div>
                    {/* Requested card */}
                    <div className="bg-[var(--surface-1)] rounded-xl p-3 border border-[var(--card-border)]">
                      <p className="text-[10px] text-[var(--warm-500)] uppercase tracking-wider mb-1">Requested</p>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{offer.requested_card_id}</p>
                      <p className="text-xs text-amber-400">{GAME_LABELS[offer.requested_game] || offer.requested_game}</p>
                      <p className="text-[10px] text-[var(--warm-400)]">{offer.requested_condition}</p>
                    </div>
                  </div>

                  {offer.message && (
                    <p className="text-xs text-[var(--warm-300)] bg-[var(--surface-1)] rounded-lg p-3 mb-3 italic">&ldquo;{offer.message}&rdquo;</p>
                  )}

                  {/* Actions */}
                  {offer.status === 'pending' && (
                    <div className="flex gap-2">
                      {isIncoming && (
                        <>
                          <button
                            onClick={() => updateOfferStatus(offer.id, 'accepted')}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-400 transition-all"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => updateOfferStatus(offer.id, 'rejected')}
                            className="px-4 py-2 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold hover:bg-red-500/25 transition-all"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {!isIncoming && (
                        <button
                          onClick={() => updateOfferStatus(offer.id, 'cancelled')}
                          className="px-4 py-2 bg-[var(--surface-1)] text-[var(--warm-400)] border border-[var(--card-border)] rounded-lg text-xs font-semibold hover:text-[var(--foreground)] transition-all"
                        >
                          Cancel Offer
                        </button>
                      )}
                    </div>
                  )}

                  {offer.status === 'accepted' && (
                    <button
                      onClick={() => updateOfferStatus(offer.id, 'completed')}
                      className="px-4 py-2 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold hover:bg-blue-500/25 transition-all"
                    >
                      Mark Completed
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