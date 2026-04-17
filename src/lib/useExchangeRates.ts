'use client'

import { useState, useEffect, useCallback } from 'react'

interface ExchangeRates {
  USD: number
  EUR: number
  THB: number
}

const FALLBACK: ExchangeRates = { USD: 1.0, EUR: 1.08, THB: 33.5 }

export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRates>(FALLBACK)

  useEffect(() => {
    fetch('/api/rates')
      .then(r => r.ok ? r.json() : { rates: FALLBACK })
      .then(data => setRates(data.rates || FALLBACK))
      .catch(() => setRates(FALLBACK))
  }, [])

  const toUSD = useCallback((eurAmount: number): number => {
    return eurAmount / (rates.EUR || 1.08)
  }, [rates])

  const toTHB = useCallback((usdAmount: number): number => {
    return usdAmount * (rates.THB || 33.5)
  }, [rates])

  const formatUSD = useCallback((amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '—'
    return `$${amount.toFixed(2)}`
  }, [])

  const formatTHB = useCallback((amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '—'
    return `฿${amount.toFixed(2)}`
  }, [])

  return { rates, toUSD, toTHB, formatUSD, formatTHB }
}