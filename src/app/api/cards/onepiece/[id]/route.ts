import { NextResponse } from 'next/server'

const TCG_API_BASE = 'https://api.tcgpricelookup.com/v1'

function getApiKey(): string {
  return process.env.TCG_PRICE_LOOKUP_API_KEY || ''
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cardId } = await params
  const apiKey = getApiKey()

  if (!apiKey) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 })
  }

  try {
    // The cardId from One Piece search is like "OP05-001" or "ST01-001"
    // Search by this ID in the TCG Price Lookup API
    const res = await fetch(
      `${TCG_API_BASE}/cards/search?q=${encodeURIComponent(cardId)}&game=onepiece&pageSize=5`,
      {
        headers: { 'X-API-Key': apiKey },
        next: { revalidate: 300 },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch card' }, { status: res.status })
    }

    const data = await res.json()
    const cards = data.data || []

    // Try to find exact match by card number
    const match = cards.find((c: any) =>
      c.number === cardId || c.name?.toLowerCase() === cardId.toLowerCase()
    ) || cards[0]

    if (!match) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: match.id,
      tcgplayerId: match.tcgplayer_id,
      name: match.name,
      number: match.number,
      rarity: match.rarity,
      variant: match.variant,
      imageUrl: match.image_url,
      setName: typeof match.set === 'object' ? match.set.name : '',
      setSlug: typeof match.set === 'object' ? (match.set as any).slug || '' : '',
      game: match.game,
      prices: {
        nearMint: match.prices?.raw?.near_mint?.tcgplayer || null,
        lightlyPlayed: match.prices?.raw?.lightly_played?.tcgplayer || null,
        moderatelyPlayed: match.prices?.raw?.moderately_played?.tcgplayer || null,
        heavilyPlayed: match.prices?.raw?.heavily_played?.tcgplayer || null,
        damaged: match.prices?.raw?.damaged?.tcgplayer || null,
      },
      graded: match.prices?.graded || null,
      lastPriceUpdate: match.last_price_update,
    })
  } catch (e) {
    console.error('One Piece card detail error:', e)
    return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 })
  }
}