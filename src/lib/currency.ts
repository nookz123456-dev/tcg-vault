// Currency conversion utility for HoloCheck
// Uses live exchange rates with fallback to hardcoded rates

const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,  // 1 EUR ≈ 1.08 USD
  THB: 33.5,  // 1 USD ≈ 33.5 THB
}

let cachedRates: Record<string, number> | null = null
let cachedAt: number = 0
const CACHE_TTL = 3600000 // 1 hour in ms

export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now()
  if (cachedRates && (now - cachedAt) < CACHE_TTL) {
    return cachedRates
  }

  try {
    // Free API - no key needed
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 }
    })
    if (res.ok) {
      const data = await res.json()
      if (data.rates) {
        cachedRates = {
          USD: 1.0,
          EUR: data.rates.EUR || FALLBACK_RATES.EUR,
          THB: data.rates.THB || FALLBACK_RATES.THB,
        }
        cachedAt = now
        return cachedRates
      }
    }
  } catch {
    // Fallback to hardcoded rates
  }

  cachedRates = FALLBACK_RATES
  cachedAt = now
  return cachedRates
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount
  const fromRate = rates[fromCurrency] || 1
  const toRate = rates[toCurrency] || 1
  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate
  return usdAmount * toRate
}

export function formatPrice(amount: number | null, currency: 'USD' | 'THB' = 'USD'): string {
  if (amount === null || amount === undefined) return '—'
  if (currency === 'THB') {
    return `฿${amount.toFixed(2)}`
  }
  return `$${amount.toFixed(2)}`
}

export function formatPriceDual(usdAmount: number | null, rates: Record<string, number>): { usd: string; thb: string } {
  if (usdAmount === null || usdAmount === undefined) {
    return { usd: '—', thb: '—' }
  }
  const thbAmount = convertCurrency(usdAmount, 'USD', 'THB', rates)
  return {
    usd: `$${usdAmount.toFixed(2)}`,
    thb: `฿${thbAmount.toFixed(2)}`,
  }
}