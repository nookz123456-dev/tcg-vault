import { NextResponse } from 'next/server'
import { getExchangeRates } from '@/lib/currency'

export async function GET() {
  try {
    const rates = await getExchangeRates()
    return NextResponse.json({ rates })
  } catch {
    return NextResponse.json(
      { rates: { USD: 1.0, EUR: 1.08, THB: 33.5 } },
      { status: 200 }
    )
  }
}