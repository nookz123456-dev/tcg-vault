import { NextResponse } from 'next/server'

const TCG_API_BASE = 'https://api.tcgpricelookup.com/v1'

function getApiKey(): string {
  return process.env.TCG_PRICE_LOOKUP_API_KEY || ''
}

interface TCGPriceData {
  raw?: {
    near_mint?: {
      tcgplayer?: { market: number | null; low: number | null; mid: number | null; high: number | null }
    }
    lightly_played?: {
      tcgplayer?: { market: number | null; low: number | null; mid: number | null; high: number | null }
    }
    moderately_played?: {
      tcgplayer?: { market: number | null; low: number | null; mid: number | null; high: number | null }
    }
    heavily_played?: {
      tcgplayer?: { market: number | null; low: number | null; mid: number | null; high: number | null }
    }
    damaged?: {
      tcgplayer?: { market: number | null; low: number | null; mid: number | null; high: number | null }
    }
  }
  graded?: Record<string, {
    ebay?: { avg_7d: number | null; avg_30d: number | null }
    tcgplayer?: { market: number | null }
  }>
}

interface TCGCardResult {
  id: string
  tcgplayer_id: string | null
  name: string
  number: string
  rarity: string | null
  variant: string | null
  image_url: string | null
  set: { id: string; slug: string; name: string } | { id: string; name: string }
  game: string
  prices: TCGPriceData
  last_price_update: string | null
  updated_at: string | null
}

// Search for card prices by name
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const game = searchParams.get('game') || 'pokemon'
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  if (!query.trim()) {
    return NextResponse.json({ data: [], totalCount: 0 })
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    return NextResponse.json({ data: [], totalCount: 0, error: 'No API key configured' })
  }

  try {
    const gameSlug = game === 'pokemon-jp' ? 'pokemon-jp' : game === 'onepiece' ? 'onepiece' : 'pokemon'

    const res = await fetch(
      `${TCG_API_BASE}/cards/search?q=${encodeURIComponent(query)}&game=${gameSlug}&pageSize=${pageSize}`,
      {
        headers: { 'X-API-Key': apiKey },
        next: { revalidate: 300 },
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('TCG Price API error:', res.status, err)
      return NextResponse.json({ data: [], totalCount: 0, error: err }, { status: res.status })
    }

    const data = await res.json()
    const cards: TCGCardResult[] = data.data || []

    // Map to simplified format
    const mapped = cards.map(card => ({
      id: card.id,
      tcgplayerId: card.tcgplayer_id,
      name: card.name,
      number: card.number,
      rarity: card.rarity,
      variant: card.variant,
      imageUrl: card.image_url,
      setName: typeof card.set === 'object' ? card.set.name : '',
      setSlug: typeof card.set === 'object' ? (card.set as { slug?: string }).slug || '' : '',
      game: card.game,
      prices: {
        nearMint: card.prices?.raw?.near_mint?.tcgplayer || null,
        lightlyPlayed: card.prices?.raw?.lightly_played?.tcgplayer || null,
        moderatelyPlayed: card.prices?.raw?.moderately_played?.tcgplayer || null,
        heavilyPlayed: card.prices?.raw?.heavily_played?.tcgplayer || null,
        damaged: card.prices?.raw?.damaged?.tcgplayer || null,
      },
      graded: card.prices?.graded || null,
      lastPriceUpdate: card.last_price_update,
    }))

    return NextResponse.json({
      data: mapped,
      totalCount: data.total_count || cards.length,
    })
  } catch (e) {
    console.error('TCG Price lookup error:', e)
    return NextResponse.json({ data: [], totalCount: 0, error: 'Failed to fetch prices' }, { status: 500 })
  }
}