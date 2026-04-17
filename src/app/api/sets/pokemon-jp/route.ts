import { NextRequest, NextResponse } from 'next/server'

const TCGDEX_JP = 'https://api.tcgdex.net/v2/ja'

export async function GET() {
  try {
    const res = await fetch(`${TCGDEX_JP}/sets`, {
      headers: {
        'User-Agent': 'TCGVault/1.0',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`TCGdex JP error: ${res.status}`)
    }

    const data = await res.json()

    if (!Array.isArray(data)) {
      return NextResponse.json({ data: [], totalCount: 0 })
    }

    const sets = data.map((s: any) => ({
      id: s.id,
      name: s.name,
      cardCount: s.cardCount?.total || s.cardCount?.official || 0,
      releaseDate: s.releaseDate || null,
      logo: s.logo || null,
      symbol: s.symbol || null,
    }))

    // Sort by release date descending
    sets.sort((a: any, b: any) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))

    return NextResponse.json({ data: sets, totalCount: sets.length })
  } catch (error) {
    console.error('Pokemon JP sets error:', error)
    return NextResponse.json({ data: [], totalCount: 0, error: 'Failed to fetch JP sets' }, { status: 500 })
  }
}