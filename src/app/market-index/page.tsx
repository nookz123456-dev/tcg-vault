'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useT } from '@/lib/i18n'

// Simulated index data — in production this would come from an API
const INDEX_DATA = {
  holo100: { value: 2847.32, change: +2.14, sparkline: [2780, 2790, 2785, 2810, 2805, 2830, 2847] },
  sealed: { value: 892.15, change: -0.87, sparkline: [900, 895, 898, 890, 888, 893, 892] },
  graded: { value: 15230.50, change: +3.42, sparkline: [14700, 14800, 14950, 15000, 15100, 15150, 15230] },
  jp: { value: 1456.78, change: +1.23, sparkline: [1430, 1435, 1440, 1438, 1450, 1455, 1456] },
}

const HOT_CARDS = [
  { name: 'Charizard ex', set: 'SV8pt5', change: +18.5, price: 45.20, game: 'pokemon' },
  { name: 'Pikachu 151', set: 'SV3a', change: +12.3, price: 28.90, game: 'pokemon' },
  { name: 'Umbreon VMAX Alt', set: 'EVS', change: +8.7, price: 189.00, game: 'pokemon' },
  { name: 'Mew ex SAR', set: 'SV6a', change: +6.2, price: 32.50, game: 'pokemon-jp' },
]

const COLD_CARDS = [
  { name: 'Lugia V', set: 'SIT', change: -5.4, price: 12.30, game: 'pokemon' },
  { name: 'Arceus VSTAR', set: 'BRS', change: -3.8, price: 8.50, game: 'pokemon' },
  { name: 'Mewtwo VMAX', set: 'CRZ', change: -2.9, price: 15.20, game: 'pokemon' },
  { name: 'Rayquaza VMAX', set: 'EVS', change: -2.1, price: 22.10, game: 'pokemon' },
]

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 80
  const h = 24
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-6" fill="none">
      <polyline points={points} stroke={positive ? '#10b981' : '#ef4444'} strokeWidth="1.5" fill="none" />
    </svg>
  )
}

export default function MarketIndexPage() {
  const t = useT()
  const [tab, setTab] = useState<'overview' | 'hot' | 'cold'>('overview')

  const indices = [
    { key: 'holo100', name: t('index.holo100'), icon: '📊', ...INDEX_DATA.holo100 },
    { key: 'sealed', name: t('index.sealed'), icon: '📦', ...INDEX_DATA.sealed },
    { key: 'graded', name: t('index.graded'), icon: '💎', ...INDEX_DATA.graded },
    { key: 'jp', name: t('index.jp'), icon: '🇯🇵', ...INDEX_DATA.jp },
  ]

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e2235] tracking-tight mb-2">
            {t('index.title')}
          </h1>
          <p className="text-[#5c6078] text-sm">{t('index.subtitle')}</p>
        </div>

        {/* Index Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {indices.map(idx => (
            <div key={idx.key} className="bg-white border border-[#e8eaf0] rounded-xl p-4 hover:shadow-md hover:border-[#6366f1]/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{idx.icon}</span>
                  <h3 className="text-sm font-bold text-[#1e2235]">{idx.name}</h3>
                </div>
                <MiniSparkline data={idx.sparkline} positive={idx.change >= 0} />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-extrabold text-[#1e2235]">${idx.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p className={`text-sm font-semibold ${idx.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}%
                  </p>
                </div>
                <span className="text-[10px] text-[#b5b8c8]">24h</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6">
          {[
            { key: 'overview' as const, icon: '📋', label: t('index.overview') },
            { key: 'hot' as const, icon: '🔥', label: t('index.hot') },
            { key: 'cold' as const, icon: '❄️', label: t('index.cold') },
          ].map(tb => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                tab === tb.key
                  ? 'bg-[#6366f1] text-white shadow-sm shadow-[#6366f1]/20'
                  : 'bg-white border border-[#e8eaf0] text-[#5c6078] hover:text-[#1e2235] hover:border-[#6366f1]/20'
              }`}
            >
              <span>{tb.icon}</span>
              <span>{tb.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#e8eaf0] rounded-xl p-5">
              <h3 className="text-sm font-bold text-[#1e2235] mb-3">{t('index.aboutTitle')}</h3>
              <div className="space-y-3 text-xs text-[#5c6078] leading-relaxed">
                <p>{t('index.about1')}</p>
                <p>{t('index.about2')}</p>
                <p>{t('index.about3')}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#f5f6fa] rounded-lg p-3 text-center">
                  <p className="text-lg font-extrabold text-[#6366f1]">100</p>
                  <p className="text-[10px] text-[#8b8fa6]">{t('index.cardsTracked')}</p>
                </div>
                <div className="bg-[#f5f6fa] rounded-lg p-3 text-center">
                  <p className="text-lg font-extrabold text-emerald-500">+2.1%</p>
                  <p className="text-[10px] text-[#8b8fa6]">{t('index.24hChange')}</p>
                </div>
                <div className="bg-[#f5f6fa] rounded-lg p-3 text-center">
                  <p className="text-lg font-extrabold text-[#1e2235]">370+</p>
                  <p className="text-[10px] text-[#8b8fa6]">{t('index.setsCovered')}</p>
                </div>
                <div className="bg-[#f5f6fa] rounded-lg p-3 text-center">
                  <p className="text-lg font-extrabold text-amber-500">24h</p>
                  <p className="text-[10px] text-[#8b8fa6]">{t('index.updateFreq')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hot Tab */}
        {tab === 'hot' && (
          <div className="space-y-2.5">
            {HOT_CARDS.map((card, i) => (
              <Link key={i} href={`/card/pokemon/${card.set.toLowerCase()}-${i + 1}`} className="bg-white border border-[#e8eaf0] rounded-xl p-3.5 flex items-center gap-3 hover:shadow-md hover:border-[#6366f1]/20 transition-all group">
                <div className="w-8 h-10 bg-[#f5f6fa] rounded flex items-center justify-center text-lg">🔥</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#1e2235] group-hover:text-[#6366f1] transition-colors truncate">{card.name}</h3>
                  <p className="text-xs text-[#8b8fa6]">{card.set}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-[#1e2235]">${card.price.toFixed(2)}</p>
                  <p className="text-xs font-semibold text-emerald-500">+{card.change}%</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Cold Tab */}
        {tab === 'cold' && (
          <div className="space-y-2.5">
            {COLD_CARDS.map((card, i) => (
              <Link key={i} href={`/card/pokemon/${card.set.toLowerCase()}-${i + 1}`} className="bg-white border border-[#e8eaf0] rounded-xl p-3.5 flex items-center gap-3 hover:shadow-md hover:border-[#6366f1]/20 transition-all group">
                <div className="w-8 h-10 bg-[#f5f6fa] rounded flex items-center justify-center text-lg">❄️</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#1e2235] group-hover:text-[#6366f1] transition-colors truncate">{card.name}</h3>
                  <p className="text-xs text-[#8b8fa6]">{card.set}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-[#1e2235]">${card.price.toFixed(2)}</p>
                  <p className="text-xs font-semibold text-red-400">{card.change}%</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-[#b5b8c8]">{t('index.disclaimer')}</p>
        </div>
      </div>
    </div>
  )
}