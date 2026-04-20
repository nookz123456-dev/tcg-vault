'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useT } from '@/lib/i18n'

interface BadgeDefinition {
 id: string
 name: string
 description: string
 icon: string
 category: string
 threshold: number
}

const CATEGORY_LABELS: Record<string, { th: string; en: string }> = {
 collection: { th: 'คอลเลกชัน', en: 'Collection' },
 social: { th: 'สังคม', en: 'Social' },
 trading: { th: 'แลกเปลี่ยน', en: 'Trading' },
 special: { th: 'พิเศษ', en: 'Special' },
}

const CATEGORY_ICONS: Record<string, string> = {
 collection: '🃏',
 social: '👥',
 trading: '🤝',
 special: '⭐',
}

export default function BadgesPage() {
 const t = useT()
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
 <div className="animate-pulse h-8 w-40 rounded-lg mb-8" />
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
 {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="animate-pulse h-36 rounded-xl" />)}
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
 <h1 className="text-3xl font-extrabold text-[#1e2235] tracking-tight mb-3">
 🏅 {t('badges.title')}
 </h1>
 <p className="text-[#5c6078]">
 {t('badges.subtitle')}
 </p>
 </div>

 <div className="space-y-10">
 {Object.entries(badgesByCategory).map(([category, catBadges]) => (
 <div key={category}>
 <div className="flex items-center gap-2 mb-4">
 <span className="text-xl">{CATEGORY_ICONS[category] || '🏅'}</span>
 <h2 className="text-lg font-bold text-[#6366f1] uppercase tracking-wider">
 {t(`badges.category.${category}` as any) || category}
 </h2>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
 {catBadges.map(badge => (
 <div
 key={badge.id}
 className="bg-white border border-[#e8eaf0] rounded-2xl p-5 text-center hover:shadow-md hover:shadow-[#6366f1]/5 transition-all"
 >
 <div className="text-4xl mb-3">{badge.icon}</div>
 <p className="text-sm font-bold text-[#1e2235]">{badge.name}</p>
 <p className="text-xs text-[#8b8fa6] mt-1.5 leading-relaxed">{badge.description}</p>
 {badge.threshold > 0 && (
 <p className="text-[10px] text-[#b5b8c8] mt-2">
 {t('badges.unlock')}
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