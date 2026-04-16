'use client'

import { useLocalCollection } from '@/lib/useLocalCollection'
import { useAuth } from '@/lib/useAuth'
import { CONDITION_LABELS, GAME_LABELS } from '@/lib/api'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function CollectionPage() {
  const { cards, isLoaded, removeCard, updateCard, totalValue, totalInvested, totalCards } = useLocalCollection()
  const { user, isGuest, isAuthenticated, loading: authLoading } = useAuth()

  const profitLoss = totalValue - totalInvested
  const profitPct = totalInvested > 0 ? ((profitLoss / totalInvested) * 100) : 0

  if (authLoading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">My Collection</h1>
          {isGuest && (
            <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded-lg">
              Guest Mode
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 mb-8">
          {isGuest
            ? 'Data saved locally on this device. Sign in to sync across devices.'
            : 'Track and manage your card portfolio'}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total Cards</p>
            <p className="text-2xl font-bold text-white">{totalCards}</p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Collection Value</p>
            <p className="text-2xl font-bold text-amber-400">${totalValue.toFixed(2)}</p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total Invested</p>
            <p className="text-2xl font-bold text-gray-300">${totalInvested.toFixed(2)}</p>
          </div>
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Profit/Loss</p>
            <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {profitLoss >= 0 ? '+' : ''}{profitLoss.toFixed(2)}
              {totalInvested > 0 && (
                <span className="text-sm ml-1">({profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%)</span>
              )}
            </p>
          </div>
        </div>

        {/* Card list */}
        {cards.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-400 text-lg mb-2">Your collection is empty</p>
            <p className="text-gray-500 text-sm mb-6">Start by searching for cards and adding them</p>
            <Link
              href="/search"
              className="inline-block px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all"
            >
              Search Cards
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 flex items-center gap-4 card-hover"
              >
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-16 h-22 object-contain rounded"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate">{card.name}</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      card.game === 'pokemon'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {GAME_LABELS[card.game as keyof typeof GAME_LABELS]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{card.setName}</p>
                  {card.rarity && (
                    <p className="text-xs text-amber-400">{card.rarity}</p>
                  )}
                </div>

                <div className="text-center hidden sm:block">
                  <p className="text-[10px] text-gray-500">Condition</p>
                  <p className="text-xs text-gray-300">
                    {CONDITION_LABELS[card.condition] || card.condition}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-[10px] text-gray-500">Qty</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => card.quantity > 1 && updateCard(card.id, { quantity: card.quantity - 1 })}
                      className="w-6 h-6 bg-[var(--surface-1)] rounded text-gray-400 hover:text-white text-xs"
                    >
                      -
                    </button>
                    <span className="text-sm text-white font-semibold w-6 text-center">{card.quantity}</span>
                    <button
                      onClick={() => updateCard(card.id, { quantity: card.quantity + 1 })}
                      className="w-6 h-6 bg-[var(--surface-1)] rounded text-gray-400 hover:text-white text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  {card.marketPrice && (
                    <>
                      <p className="text-[10px] text-gray-500">Market</p>
                      <p className="text-sm font-bold text-amber-400">${card.marketPrice.toFixed(2)}</p>
                    </>
                  )}
                  {card.purchasePrice && (
                    <>
                      <p className="text-[10px] text-gray-500">Paid</p>
                      <p className="text-xs text-gray-400">${card.purchasePrice.toFixed(2)}</p>
                    </>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-gray-500">Total</p>
                  <p className="text-sm font-bold text-white">
                    ${((card.marketPrice || card.purchasePrice || 0) * card.quantity).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (confirm('Remove this card?')) removeCard(card.id)
                  }}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {cards.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/search"
              className="inline-block px-6 py-3 bg-[var(--surface-1)] border border-[var(--card-border)] text-gray-400 rounded-xl hover:text-amber-400 hover:border-amber-500/30 transition-colors mr-4"
            >
              + Add More Cards
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}