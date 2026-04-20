'use client'

import { useState, useMemo } from 'react'
import Navbar from '@/components/Navbar'
import { useT } from '@/lib/i18n'

const GRADING_COSTS: Record<string, { name: string; cost: number; turnaround: string }> = {
  psa: { name: 'PSA', cost: 22, turnaround: '15-20 business days' },
  bgs: { name: 'BGS', cost: 18, turnaround: '15-25 business days' },
  cgc: { name: 'CGC', cost: 15, turnaround: '10-15 business days' },
  sgc: { name: 'SGC', cost: 15, turnaround: '10-15 business days' },
}

const GRADE_MULTIPLIERS: Record<string, Record<string, number>> = {
  psa: { '10': 3.5, '9': 2.0, '8': 1.3, '7': 0.8 },
  bgs: { '10': 4.0, '9.5': 2.5, '9': 1.8, '8.5': 1.2 },
  cgc: { '10': 3.2, '9.5': 2.2, '9': 1.6, '8.5': 1.1 },
  sgc: { '10': 2.8, '9.5': 2.0, '9': 1.5, '8.5': 1.0 },
}

export default function GradingROIPage() {
  const t = useT()
  const [rawPrice, setRawPrice] = useState('')
  const [condition, setCondition] = useState('nearMint')
  const [company, setCompany] = useState('psa')

  const results = useMemo(() => {
    const price = parseFloat(rawPrice)
    if (!price || price <= 0) return null

    const cost = GRADING_COSTS[company].cost
    const multipliers = GRADE_MULTIPLIERS[company]
    const condMultiplier = condition === 'nearMint' ? 1 : condition === 'lightlyPlayed' ? 0.85 : condition === 'moderatelyPlayed' ? 0.65 : 0.45

    return Object.entries(multipliers).map(([grade, mult]) => {
      const estimatedValue = price * mult * condMultiplier
      const totalCost = price + cost
      const profit = estimatedValue - totalCost
      const roi = ((profit) / totalCost) * 100
      return {
        grade,
        estimatedValue,
        totalCost,
        profit,
        roi,
        isProfit: profit > 0,
      }
    })
  }, [rawPrice, condition, company])

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e2235] tracking-tight mb-2">
            {t('grade.title')}
          </h1>
          <p className="text-[#5c6078] text-sm">{t('grade.subtitle')}</p>
        </div>

        {/* Calculator */}
        <div className="bg-white border border-[#e8eaf0] rounded-xl p-5 mb-6">
          <h3 className="text-sm font-bold text-[#1e2235] mb-4">{t('grade.calculator')}</h3>

          {/* Raw Price Input */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#5c6078] mb-1.5 block">{t('grade.rawPrice')}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8b8fa6]">$</span>
              <input
                type="number"
                value={rawPrice}
                onChange={e => setRawPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-7 pr-4 py-2.5 bg-[#fafbfc] border border-[#e8eaf0] rounded-lg text-[#1e2235] placeholder:text-[#b5b8c8] focus:outline-none focus:border-[#6366f1]/50 text-sm"
              />
            </div>
          </div>

          {/* Condition */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#5c6078] mb-1.5 block">{t('grade.condition')}</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'nearMint', label: t('condition.nearMint'), color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
                { key: 'lightlyPlayed', label: t('condition.lightlyPlayed'), color: 'bg-lime-500/10 text-lime-600 border-lime-500/20' },
                { key: 'moderatelyPlayed', label: t('condition.moderatelyPlayed'), color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
                { key: 'heavilyPlayed', label: t('condition.heavilyPlayed'), color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
              ].map(opt => (
                <button key={opt.key} onClick={() => setCondition(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    condition === opt.key
                      ? `${opt.color} border`
                      : 'bg-[#fafbfc] text-[#5c6078] border border-[#e8eaf0] hover:border-[#6366f1]/30'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grading Company */}
          <div className="mb-2">
            <label className="text-xs font-semibold text-[#5c6078] mb-1.5 block">{t('grade.company')}</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(GRADING_COSTS).map(([key, info]) => (
                <button key={key} onClick={() => setCompany(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    company === key
                      ? 'bg-[#6366f1] text-white'
                      : 'bg-[#fafbfc] text-[#5c6078] border border-[#e8eaf0] hover:border-[#6366f1]/30'
                  }`}>
                  {info.name} (${info.cost})
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#8b8fa6] mt-1.5">
              {t('grade.turnaround')}: {GRADING_COSTS[company].turnaround}
            </p>
          </div>
        </div>

        {/* Results */}
        {results ? (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#1e2235]">{t('grade.results')}</h3>
            {results.map(r => (
              <div key={r.grade} className={`bg-white border rounded-xl p-4 ${r.isProfit ? 'border-emerald-500/20' : 'border-[#e8eaf0]'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#1e2235]">
                      {GRADING_COSTS[company].name} {r.grade}
                    </p>
                    <p className="text-xs text-[#8b8fa6] mt-0.5">
                      {t('grade.estimatedValue')}: ${r.estimatedValue.toFixed(2)} · {t('grade.totalCost')}: ${r.totalCost.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-extrabold ${r.isProfit ? 'text-emerald-500' : 'text-red-400'}`}>
                      {r.profit >= 0 ? '+' : ''}{r.profit.toFixed(2)}
                    </p>
                    <p className={`text-xs font-semibold ${r.isProfit ? 'text-emerald-500' : 'text-red-400'}`}>
                      ROI {r.roi >= 0 ? '+' : ''}{r.roi.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {/* ROI Bar */}
                <div className="mt-2 h-1.5 bg-[#f5f6fa] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${r.isProfit ? 'bg-emerald-500' : 'bg-red-400'}`}
                    style={{ width: `${Math.min(100, Math.abs(r.roi))}%` }}
                  />
                </div>
              </div>
            ))}

            <p className="text-[10px] text-[#b5b8c8] mt-4 text-center">{t('grade.disclaimer')}</p>
          </div>
        ) : (
          <div className="bg-white border border-[#e8eaf0] rounded-xl p-10 text-center">
            <div className="text-4xl mb-3 opacity-50">💎</div>
            <p className="text-sm text-[#8b8fa6]">{t('grade.enterPrice')}</p>
          </div>
        )}
      </div>
    </div>
  )
}