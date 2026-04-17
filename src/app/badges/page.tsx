'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'

interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: string
  threshold: number
}

const CATEGORY_LABELS: Record<string, string> = {
  collection: 'Collection',
  social: 'Social',
  trading: 'Trading',
  special: 'Special',
}

const CATEGORY_ICONS: Record<string, string> = {
  collection: '🃏',
  social: '👥',
  trading: '🤝',
  special: '⭐',
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<BadgeDefinition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/badges').then(r => r.json()).then(data => {
      setBadges(data.badges || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const badgesByCategory = badges.reduce((acc, b) => {
    if (!acc[b.category]) acc[b.category] = []
    acc[b.category].push(b)
    return acc
  }, {} as Record<string, BadgeDefinition[]>)

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="shimmer h-8 w-40 rounded-lg mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="shimmer h-36 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight mb-3">
            🏅 Badges
          </h1>
          <p className="text-[var(--warm-300)]">
            Earn badges by collecting, trading, and participating in the community
          </p>
        </div>

        <div className="space-y-10">
          {Object.entries(badgesByCategory).map(([category, catBadges]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{CATEGORY_ICONS[category] || '🏅'}</span>
                <h2 className="text-lg font-bold text-amber-400 uppercase tracking-wider">
                  {CATEGORY_LABELS[category] || category}
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {catBadges.map(badge => (
                  <div
                    key={badge.id}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 text-center card-hover"
                  >
                    <div className="text-4xl mb-3">{badge.icon}</div>
                    <p className="text-sm font-bold text-[var(--foreground)]">{badge.name}</p>
                    <p className="text-xs text-[var(--warm-400)] mt-1.5 leading-relaxed">{badge.description}</p>
                    {badge.threshold > 0 && (
                      <p className="text-[10px] text-[var(--warm-500)] mt-2">
                        Reach {badge.threshold} to unlock
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}