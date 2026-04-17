'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface PriceHistoryChartProps {
  cardId: string
  game: 'pokemon' | 'onepiece' | 'pokemon-jp'
  height?: number
}

interface HistoryPoint {
  date: string
  price: number
}

type Period = '7d' | '30d' | '1y'

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7D',
  '30d': '30D',
  '1y': '1Y',
}

export default function PriceHistoryChart({ cardId, game, height = 280 }: PriceHistoryChartProps) {
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('30d')
  const [error, setError] = useState('')

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/price-history?cardId=${encodeURIComponent(cardId)}&game=${game}&period=${p}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setHistory(data.history || [])
    } catch {
      setError('Unable to load price history')
    } finally {
      setLoading(false)
    }
  }, [cardId, game])

  useEffect(() => {
    fetchData(period)
  }, [period, fetchData])

  const formatXAxis = (dateStr: string) => {
    const d = new Date(dateStr)
    if (period === '1y') return d.toLocaleDateString('en-US', { month: 'short' })
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
    return `$${value.toFixed(0)}`
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null
    const d = new Date(label || '')
    return (
      <div className="bg-white border border-[#e8eaf0] rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs text-[#8b8fa6]">
          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <p className="text-sm font-bold text-[#6366f1]">${payload[0].value.toFixed(2)}</p>
      </div>
    )
  }

  // Calculate price change
  const firstPrice = history.length > 1 ? history[0].price : null
  const lastPrice = history.length > 1 ? history[history.length - 1].price : null
  const priceChange = firstPrice && lastPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : null

  return (
    <div className="bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e8eaf0] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1e2235]">Price History</h2>
          {priceChange !== null && (
            <p className={`text-xs font-medium mt-0.5 ${priceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(1)}% over period
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-[#6366f1] text-white'
                  : 'bg-[#f5f6fa] text-[#8b8fa6] hover:text-[#1e2235]'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 py-3">
        {loading ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="w-full">
              <div className="shimmer h-4 w-24 rounded mb-4" />
              <div className="shimmer" style={{ height: height - 40 }} />
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-[#8b8fa6] text-sm">{error}</p>
          </div>
        ) : history.length < 2 ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-[#8b8fa6] text-sm">No price history available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={history} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 11, fill: '#8b8fa6' }}
                axisLine={{ stroke: '#e8eaf0' }}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11, fill: '#8b8fa6' }}
                axisLine={{ stroke: '#e8eaf0' }}
                tickLine={false}
                width={50}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{ r: 4, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}