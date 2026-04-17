import { NextResponse } from 'next/server'
import { getPokemonJPCardTCGdex, getJPImageUrl, mapType } from '@/lib/tcgdex-jp-api'
import { getJapanesePokemonName } from '@/lib/pokemon-jp-names'

const TCG_API_BASE = 'https://api.tcgpricelookup.com/v1'

function getApiKey(): string {
  return process.env.TCG_PRICE_LOOKUP_API_KEY || ''
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: cardId } = await params
  
  // cardId from URL is the TCGdex card ID (e.g., "SV2D-017")
  // Or it could be a card name from old URLs

  try {
    // Step 1: Fetch card details from TCGdex JP API
    let cardData = await getPokemonJPCardTCGdex(cardId)
    
    // If not found by ID, it might be a name-based URL (old format)
    // Try to search by name instead
    if (!cardData) {
      const { searchPokemonJPCardsTCGdex } = await import('@/lib/tcgdex-jp-api')
      const searchResult = await searchPokemonJPCardsTCGdex(cardId)
      if (searchResult.data.length > 0) {
        cardData = searchResult.data[0]
      }
    }

    if (!cardData) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Step 2: Get English name from PokeAPI for reference
    const englishName = await getJapanesePokemonName
      ? null // We'll use the dexId to get English name if needed
      : null

    // Step 3: Fetch price data from TCG Price Lookup API
    let priceData: any = null
    const apiKey = getApiKey()
    if (apiKey && cardData.dexId) {
      try {
        // Search by Pokedex number / name
        const searchQuery = `${cardId}`
        const priceRes = await fetch(
          `${TCG_API_BASE}/cards/search?q=${encodeURIComponent(searchQuery)}&game=pokemon-jp&pageSize=5`,
          {
            headers: { 'X-API-Key': apiKey },
            next: { revalidate: 300 },
          }
        )

        if (priceRes.ok) {
          const priceJson = await priceRes.json()
          const priceCards = priceJson.data || []
          if (priceCards.length > 0) {
            priceData = priceCards[0]
          }
        }
      } catch (e) {
        console.error('[PokemonJP Detail] Price lookup error:', e)
      }
    }

    // Step 4: Build CardMarket pricing from TCGdex data
    const cm = cardData.pricing?.cardmarket
    const cmPrices = cm ? {
      trend: cm.trend,
      avg: cm.avg,
      low: cm.low,
      avg7: cm.avg7,
      avg30: cm.avg30,
      unit: cm.unit, // EUR
    } : null

    // Build response
    const result: any = {
      id: cardData.id,
      name: cardData.name, // Japanese name (ピカチュウ)
      nameJP: cardData.name, // Same as name for JP cards
      number: cardData.localId,
      rarity: cardData.rarity || null,
      variant: null,
      imageUrl: cardData.image ? getJPImageUrl(cardData.image, 'high') : null,
      setName: cardData.set?.name || '',
      setSlug: cardData.set?.id || '',
      game: 'pokemon-jp',
      // JP-specific fields
      hp: cardData.hp?.toString() || null,
      types: cardData.types || [],
      evolution: cardData.stage || null,
      skills: cardData.attacks?.map(a => ({
        name: a.name, // Japanese attack name
        cost: a.cost?.join(', ') || '',
        damage: a.damage || '',
      })) || [],
      supertype: cardData.category || null,
      weakness: cardData.weaknesses?.map(w => `${mapType(w.type)} ${w.value}`) || [],
      resistance: cardData.resistances?.map(r => `${mapType(r.type)} ${r.value}`) || [],
      retreat: cardData.retreat || null,
      description: cardData.description || null,
      illustrator: cardData.illustrator || null,
      dexId: cardData.dexId?.[0] || null,
      regulationMark: cardData.regulationMark || null,
      legal: cardData.legal || null,
      variants: cardData.variants || null,
      // Pricing
      cardMarket: cmPrices,
      prices: {
        nearMint: priceData?.prices?.raw?.near_mint?.tcgplayer || null,
        lightlyPlayed: priceData?.prices?.raw?.lightly_played?.tcgplayer || null,
        moderatelyPlayed: priceData?.prices?.raw?.moderately_played?.tcgplayer || null,
        heavilyPlayed: priceData?.prices?.raw?.heavily_played?.tcgplayer || null,
        damaged: priceData?.prices?.raw?.damaged?.tcgplayer || null,
      },
      graded: priceData?.prices?.graded || null,
      lastPriceUpdate: priceData?.last_price_update || cardData.updated || null,
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error('Pokemon JP card detail error:', e)
    return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 })
  }
}