import { NextResponse } from 'next/server'
import { findOPTCGCard, getOPTCGImageUrl } from '@/lib/onepiece-api'

const TCG_API_BASE = 'https://api.tcgpricelookup.com/v1'

function getApiKey(): string {
  return process.env.TCG_PRICE_LOOKUP_API_KEY || ''
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cardId } = await params

  try {
    // Step 1: Try OPTCG API for image + market price
    const optcgData = await findOPTCGCard(cardId)

    // Step 2: Also try TCG Price Lookup for condition prices
    const apiKey = getApiKey()
    let priceData: any = null
    if (apiKey) {
      try {
        const res = await fetch(
          `${TCG_API_BASE}/cards/search?q=${encodeURIComponent(cardId)}&game=onepiece&pageSize=5`,
          {
            headers: { 'X-API-Key': apiKey },
            next: { revalidate: 300 },
          }
        )
        if (res.ok) {
          const data = await res.json()
          const cards = data.data || []
          priceData = cards.find((c: any) =>
            c.number === cardId || c.name?.toLowerCase() === cardId.toLowerCase()
          ) || cards[0] || null
        }
      } catch (e) {
        console.error('[OP Detail] Price lookup error:', e)
      }
    }

    // If we have neither source, return 404
    if (!optcgData && !priceData) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Build response from available data
    // Prefer OPTCG image (no hotlink block!) over TCG Price Lookup image
    const imageUrl = optcgData?.card_image
      || (optcgData?.card_image_id ? getOPTCGImageUrl(optcgData.card_image_id) : null)
      || priceData?.image_url
      || getOPTCGImageUrl(cardId)

    return NextResponse.json({
      id: priceData?.id || cardId,
      tcgplayerId: priceData?.tcgplayer_id,
      name: optcgData?.card_name || priceData?.name || cardId,
      number: optcgData?.card_set_id || priceData?.number || cardId,
      rarity: optcgData?.rarity || priceData?.rarity || null,
      variant: priceData?.variant || (optcgData?.card_name?.includes('Parallel') ? 'Parallel' : null),
      imageUrl,
      setName: optcgData?.set_name || (typeof priceData?.set === 'object' ? priceData.set.name : '') || '',
      setSlug: typeof priceData?.set === 'object' ? (priceData.set as any).slug || '' : '',
      game: 'onepiece',
      // OPTCG market prices
      market_price: optcgData?.market_price || null,
      inventory_price: optcgData?.inventory_price || null,
      // OPTCG card metadata
      color: optcgData?.card_color || null,
      type: optcgData?.card_type || null,
      cost: optcgData?.card_cost || null,
      power: optcgData?.card_power || null,
      counter: optcgData?.counter_amount || null,
      attribute: optcgData?.attribute || null,
      sub_types: optcgData?.sub_types || null,
      ability: optcgData?.card_text || null,
      // TCG Price Lookup condition prices
      prices: priceData ? {
        nearMint: priceData.prices?.raw?.near_mint?.tcgplayer || null,
        lightlyPlayed: priceData.prices?.raw?.lightly_played?.tcgplayer || null,
        moderatelyPlayed: priceData.prices?.raw?.moderately_played?.tcgplayer || null,
        heavilyPlayed: priceData.prices?.raw?.heavily_played?.tcgplayer || null,
        damaged: priceData.prices?.raw?.damaged?.tcgplayer || null,
      } : null,
      graded: priceData?.prices?.graded || null,
      lastPriceUpdate: priceData?.last_price_update || optcgData?.date_scraped || null,
    })
  } catch (e) {
    console.error('One Piece card detail error:', e)
    return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 })
  }
}