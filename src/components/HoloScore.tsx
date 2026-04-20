'use client'

import { useT } from '@/lib/i18n'

interface HoloScoreProps {
  // Price data
  marketPrice: number | null
  lowPrice: number | null
  highPrice: number | null
  // Trend data
  avg7d: number | null
  avg30d: number | null
  trendPrice: number | null
  // Graded prices
  psa10: number | null
  psa9: number | null
  // Card info
  rarity: string | null
  setTotal: number
  cardNumber: string
  game: 'pokemon' | 'pokemon-jp' | 'onepiece'
}

function calculateHoloScore(data: HoloScoreProps): { score: number; breakdown: { trend: number; liquidity: number; gradingROI: number; rarity: number; momentum: number } } {
  let trend = 0
  let liquidity = 0
  let gradingROI = 0
  let rarity = 0
  let momentum = 0

  // ─── Trend Score (0-25) ───
  // Positive price movement = good score
  if (data.avg7d && data.avg30d && data.avg30d > 0) {
    const pctChange = ((data.avg7d - data.avg30d) / data.avg30d) * 100
    if (pctChange >= 10) trend = 25
    else if (pctChange >= 5) trend = 22
    else if (pctChange >= 0) trend = 18
    else if (pctChange >= -5) trend = 12
    else if (pctChange >= -10) trend = 8
    else trend = 4
  } else if (data.marketPrice && data.marketPrice > 0) {
    trend = 15 // No trend data, neutral
  }

  // ─── Liquidity Score (0-25) ───
  // Spread between low and high indicates liquidity
  if (data.marketPrice && data.lowPrice && data.highPrice) {
    const spread = (data.highPrice - data.lowPrice) / data.highPrice
    if (spread < 0.1) liquidity = 25      // Tight spread = high liquidity
    else if (spread < 0.2) liquidity = 22
    else if (spread < 0.4) liquidity = 18
    else if (spread < 0.6) liquidity = 14
    else liquidity = 10
  } else if (data.marketPrice && data.marketPrice > 5) {
    liquidity = 15 // Has market price, moderate liquidity
  }

  // ─── Grading ROI Score (0-25) ───
  // How much value grading adds vs raw price
  if (data.psa10 && data.marketPrice && data.marketPrice > 0) {
    const roi = data.psa10 / data.marketPrice
    if (roi >= 5) gradingROI = 25      // 5x+ value = amazing
    else if (roi >= 3) gradingROI = 22
    else if (roi >= 2) gradingROI = 18
    else if (roi >= 1.5) gradingROI = 14
    else if (roi >= 1.2) gradingROI = 10
    else gradingROI = 5                // Minimal grading premium
  } else if (data.psa9 && data.marketPrice && data.marketPrice > 0) {
    const roi = data.psa9 / data.marketPrice
    if (roi >= 2) gradingROI = 15
    else gradingROI = 8
  }

  // ─── Rarity Score (0-15) ───
  const r = (data.rarity || '').toLowerCase()
  if (r.includes('secret') || r.includes('hyper') || r.includes('special') || r.includes('illustration')) rarity = 15
  else if (r.includes('ultra') || r.includes('full') || r.includes('vmax') || r.includes('vstar')) rarity = 13
  else if (r.includes('rare') || r.includes('ex') || r.includes('v ') || r.includes('v-')) rarity = 11
  else if (r.includes('uncommon')) rarity = 7
  else if (r.includes('common')) rarity = 4
  else rarity = 8 // Default moderate

  // ─── Momentum Score (0-10) ───
  // Recent 7-day change strength
  if (data.trendPrice && data.avg30d && data.avg30d > 0) {
    const mom = ((data.trendPrice - data.avg30d) / data.avg30d) * 100
    if (mom >= 15) momentum = 10
    else if (mom >= 5) momentum = 8
    else if (mom >= 0) momentum = 6
    else if (mom >= -5) momentum = 4
    else momentum = 2
  } else {
    momentum = 5 // Neutral
  }

  const total = Math.min(100, Math.max(0, trend + liquidity + gradingROI + rarity + momentum))
  return { score: total, breakdown: { trend, liquidity, gradingROI, rarity, momentum } }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-500'
  if (score >= 60) return 'text-[#6366f1]'
  if (score >= 40) return 'text-amber-500'
  return 'text-red-400'
}

function getScoreLabel(score: number, t: (key: any) => string): string {
  if (score >= 80) return t('holoscore.hot')
  if (score >= 60) return t('holoscore.strong')
  if (score >= 40) return t('holoscore.moderate')
  return t('holoscore.cool')
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#6366f1'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

export function HoloScore(props: HoloScoreProps) {
  const t = useT()
  const { score, breakdown } = calculateHoloScore(props)
  const color = getScoreColor(score)
  const label = getScoreLabel(score, t)
  const ringColor = getScoreRingColor(score)

  const bars = [
    { key: 'trend', value: breakdown.trend, max: 25, label: t('holoscore.trend'), color: '#6366f1' },
    { key: 'liquidity', value: breakdown.liquidity, max: 25, label: t('holoscore.liquidity'), color: '#10b981' },
    { key: 'gradingROI', value: breakdown.gradingROI, max: 25, label: t('holoscore.gradingROI'), color: '#f59e0b' },
    { key: 'rarity', value: breakdown.rarity, max: 15, label: t('holoscore.rarity'), color: '#a78bfa' },
    { key: 'momentum', value: breakdown.momentum, max: 10, label: t('holoscore.momentum'), color: '#f472b6' },
  ]

  return (
    <div className="bg-white border border-[#e8eaf0] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#6366f1] to-[#a78bfa] flex items-center justify-center text-[10px] text-white font-bold">H</div>
        <h3 className="text-sm font-bold text-[#1e2235]">{t('holoscore.title')}</h3>
        <span className="text-[10px] text-[#8b8fa6] ml-auto">{t('holoscore.disclaimer')}</span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        {/* Score Circle */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e8eaf0" strokeWidth="2.5" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={ringColor} strokeWidth="2.5"
              strokeDasharray={`${(score / 100) * 97.4} 97.4`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-extrabold ${color}`}>{score}</span>
          </div>
        </div>
        <div>
          <p className={`text-sm font-bold ${color}`}>{label}</p>
          <p className="text-[10px] text-[#8b8fa6] mt-0.5">{t('holoscore.subtitle')}</p>
        </div>
      </div>

      {/* Breakdown Bars */}
      <div className="space-y-2">
        {bars.map(bar => (
          <div key={bar.key} className="flex items-center gap-2">
            <span className="text-[10px] text-[#5c6078] w-16 text-right flex-shrink-0">{bar.label}</span>
            <div className="flex-1 h-1.5 bg-[#f5f6fa] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(bar.value / bar.max) * 100}%`, backgroundColor: bar.color }} />
            </div>
            <span className="text-[10px] text-[#8b8fa6] w-5 text-right">{bar.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}