'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/useAuth'
import { useT } from '@/lib/i18n'

interface BadgeDef {
  id: string; name: string; description: string; icon: string; category: string; xp: number
}

const CATEGORIES: Record<string, { th: string; en: string; icon: string }> = {
  exploration: { th: 'สำรวจ', en: 'Exploration', icon: '🗺️' },
  tracking: { th: 'ติดตาม', en: 'Tracking', icon: '🔔' },
  community: { th: 'ชุมชน', en: 'Community', icon: '👥' },
  marketplace: { th: 'ตลาด', en: 'Marketplace', icon: '🏪' },
  tools: { th: 'เครื่องมือ', en: 'Tools', icon: '🛠️' },
  milestone: { th: 'เหมือนหิน', en: 'Milestones', icon: '🏆' },
}

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 850, 1300, 1850, 2500, 3250, 4100,
  5050, 6100, 7250, 8500, 9850, 11300, 12850, 14500, 16250, 18100, 20000,
]

function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

const LEVEL_TITLES: Record<number, { th: string; en: string }> = {
  1: { th: 'มือใหม่', en: 'Newcomer' },
  2: { th: 'ผู้สำรวจ', en: 'Explorer' },
  3: { th: 'นักสะสม', en: 'Collector' },
  5: { th: 'ดาวรุ่ง', en: 'Rising Star' },
  10: { th: 'ผู้เชี่ยวชาญ', en: 'Veteran' },
  15: { th: 'ปรมจารย์', en: 'Master' },
  20: { th: 'ตำนาน', en: 'Legend' },
}

function getLevelTitle(level: number) {
  const keys = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a)
  for (const k of keys) {
    if (level >= k) return LEVEL_TITLES[k]
  }
  return { th: 'มือใหม่', en: 'Newcomer' }
}

export default function BadgesPage() {
  const t = useT()
  const { user } = useAuth()
  const [badges, setBadges] = useState<BadgeDef[]>([])
  const [userXp, setUserXp] = useState(0)
  const [userLevel, setUserLevel] = useState(1)
  const [earnedBadges, setEarnedBadges] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/badges').then(r => r.json()).then(data => {
      setBadges(data.badges || [])
      setLoading(false)
    }).catch(() => setLoading(false))

    if (user) {
      fetch('/api/xp', { headers: { 'Authorization': `Bearer ${user.access_token}` } })
        .then(r => r.json()).then(data => {
          if (data.user) {
            setUserXp(data.user.xp)
            setUserLevel(data.user.level)
            setEarnedBadges(data.user.earnedBadges || [])
          }
        }).catch(() => {})
    }
  }, [user])

  const levelTitle = getLevelTitle(userLevel)
  const nextThreshold = LEVEL_THRESHOLDS[Math.min(userLevel, LEVEL_THRESHOLDS.length - 1)] || 20000
  const currentThreshold = LEVEL_THRESHOLDS[Math.min(userLevel - 1, LEVEL_THRESHOLDS.length - 1)] || 0
  const progress = nextThreshold > currentThreshold ? (userXp - currentThreshold) / (nextThreshold - currentThreshold) : 1

  const badgesByCategory = badges.reduce((acc, b) => {
    if (!acc[b.category]) acc[b.category] = []
    acc[b.category].push(b)
    return acc
  }, {} as Record<string, BadgeDef[]>)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse h-8 w-40 rounded-lg mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="animate-pulse h-36 rounded-xl bg-gray-200" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header + Level */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#1e2235] tracking-tight mb-2">
            🏅 {t('badges.title')}
          </h1>
          <p className="text-[#5c6078] text-sm mb-6">{t('badges.subtitle')}</p>

          {/* Level Card */}
          {user && (
            <div className="inline-flex items-center gap-4 bg-white border border-[#e8eaf0] rounded-xl px-6 py-4 shadow-sm">
              <div className="relative w-14 h-14">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e8eaf0" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#6366f1" strokeWidth="3"
                    strokeDasharray={`${Math.min(progress, 1) * 97.4} 97.4`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-extrabold text-[#6366f1]">{userLevel}</span>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-[#1e2235]">{levelTitle.th}</p>
                <p className="text-xs text-[#8b8fa6]">{userXp.toLocaleString()} XP · {t('badges.nextLevel')}: {nextThreshold.toLocaleString()} XP</p>
                <div className="w-32 h-1.5 bg-[#f5f6fa] rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-[#6366f1] rounded-full" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
                </div>
              </div>
              <div className="text-left pl-3 border-l border-[#e8eaf0]">
                <p className="text-2xl font-extrabold text-[#6366f1]">{earnedBadges.length}</p>
                <p className="text-[10px] text-[#8b8fa6]">{t('badges.earned')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Badge Categories */}
        <div className="space-y-8">
          {Object.entries(badgesByCategory).map(([category, catBadges]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{CATEGORIES[category]?.icon || '🏅'}</span>
                <h2 className="text-sm font-bold text-[#6366f1] uppercase tracking-wider">
                  {CATEGORIES[category]?.th || category}
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {catBadges.map(badge => {
                  const earned = earnedBadges.includes(badge.id)
                  return (
                    <div key={badge.id} className={`border rounded-xl p-4 text-center transition-all ${
                      earned
                        ? 'bg-[#6366f1]/5 border-[#6366f1]/20 shadow-sm'
                        : 'bg-white border-[#e8eaf0] opacity-60'
                    }`}>
                      <div className={`text-3xl mb-2 ${earned ? '' : 'grayscale'}`}>{badge.icon}</div>
                      <p className="text-xs font-bold text-[#1e2235]">{badge.name}</p>
                      <p className="text-[10px] text-[#8b8fa6] mt-1 leading-relaxed">{badge.description}</p>
                      <div className="mt-2">
                        {earned ? (
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full font-semibold">✓ {t('badges.earned')}</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-[#f5f6fa] text-[#8b8fa6] rounded-full font-medium">+{badge.xp} XP</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* XP Actions */}
        <div className="mt-10 bg-white border border-[#e8eaf0] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[#1e2235] mb-3">{t('badges.howToEarn')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { action: '🔍', xp: 2, th: 'ค้นหาการ์ด', en: 'Search a card' },
              { action: '🃏', xp: 3, th: 'ดูรายละเอียดการ์ด', en: 'View card details' },
              { action: '🇯🇵', xp: 5, th: 'ดูการ์ด JP', en: 'View JP card' },
              { action: '🔔', xp: 5, th: 'สร้างแจ้งเตือนราคา', en: 'Create price alert' },
              { action: '⭐', xp: 3, th: 'เพิ่มในวิชลิสต์', en: 'Add to watchlist' },
              { action: '💬', xp: 3, th: 'แสดงความคิดเห็น', en: 'Post a comment' },
              { action: '🏷️', xp: 8, th: 'ลงขายการ์ด', en: 'List a card for sale' },
              { action: '💎', xp: 5, th: 'ใช้เครื่องคำนวณจัดเกรด', en: 'Use Grading Calculator' },
            ].map((item, i) => (
              <div key={i} className="bg-[#f5f6fa] rounded-lg p-2.5 flex items-center gap-2">
                <span className="text-base">{item.action}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#1e2235] truncate">{item.th}</p>
                  <p className="text-[10px] text-[#6366f1] font-semibold">+{item.xp} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}