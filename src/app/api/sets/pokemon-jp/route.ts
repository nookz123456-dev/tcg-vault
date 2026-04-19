import { NextRequest, NextResponse } from 'next/server'

const TCGDEX_JP = 'https://api.tcgdex.net/v2/ja'
const TCGDEX_EN = 'https://api.tcgdex.net/v2/en'

export async function GET() {
  try {
    // Fetch JP sets (minimal: id, name, cardCount)
    const [jpRes, enRes] = await Promise.all([
      fetch(`${TCGDEX_JP}/sets`, {
        headers: { 'User-Agent': 'HoloCheck/1.0', 'Accept': 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${TCGDEX_EN}/sets`, {
        headers: { 'User-Agent': 'HoloCheck/1.0', 'Accept': 'application/json' },
        cache: 'no-store',
      }),
    ])

    if (!jpRes.ok) throw new Error(`TCGdex JP error: ${jpRes.status}`)

    const jpSets = await jpRes.json()
    const enSets = enRes.ok ? await enRes.json() : []

    if (!Array.isArray(jpSets)) {
      return NextResponse.json({ data: [], totalCount: 0 })
    }

    // Build EN logo lookup (some JP sets share IDs with EN in uppercase)
    const enLogoMap = new Map<string, string>()
    for (const s of enSets) {
      if (s.logo) enLogoMap.set(s.id.toLowerCase(), s.logo)
    }

    const sets = jpSets.map((s: any) => ({
      id: s.id,
      name: s.name,
      cardCount: s.cardCount?.total || s.cardCount?.official || 0,
      releaseDate: null, // Not available in list endpoint
      logo: enLogoMap.get(s.id.toLowerCase()) || s.logo || null,
      symbol: s.symbol || null,
    }))

    return NextResponse.json({ data: sets, totalCount: sets.length })
  } catch (error) {
    console.error('Pokemon JP sets error:', error)
    return NextResponse.json({ data: [], totalCount: 0, error: 'Failed to fetch JP sets' }, { status: 500 })
  }
}