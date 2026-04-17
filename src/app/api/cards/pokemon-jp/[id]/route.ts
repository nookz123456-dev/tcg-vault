import { NextResponse } from 'next/server'
import { searchPokemonJPCards } from '@/lib/pokemon-jp-api'

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

  try {
    // Step 1: Fetch card details from Pokemon JP search API
    // cardId from URL is the card name (English) from search results
    const searchResult = await searchPokemonJPCards(cardId, 1, 'jp')

    let cardData: any = null

    if (searchResult.data && searchResult.data.length > 0) {
      // Find best match by name
      cardData = searchResult.data.find((c: any) =>
        c.name?.toLowerCase() === cardId.toLowerCase()
      ) || searchResult.data[0]
    }

    // Step 2: Fetch price data from TCG Price Lookup API
    let priceData: any = null
    if (apiKey) {
      try {
        // Search using English name + "Japanese" or the card name directly
        const searchQuery = `${cardId} japanese`
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
            // Try to find exact match
            const exactMatch = priceCards.find((c: any) =>
              c.name?.toLowerCase() === cardId.toLowerCase()
            )
            priceData = exactMatch || priceCards[0]
          }
        }
      } catch (e) {
        console.error('[PokemonJP Detail] Price lookup error:', e)
      }
    }

    // If no card data from JP search, try to construct from price data
    if (!cardData && priceData) {
      return NextResponse.json({
        id: priceData.id || cardId,
        tcgplayerId: priceData.tcgplayer_id,
        name: priceData.name || cardId,
        number: priceData.number || '',
        rarity: priceData.rarity || null,
        variant: priceData.variant || null,
        imageUrl: priceData.image_url || null,
        setName: typeof priceData.set === 'object' ? priceData.set.name : (priceData.setName || ''),
        setSlug: typeof priceData.set === 'object' ? (priceData.set as any).slug || '' : '',
        game: 'pokemon-jp',
        prices: {
          nearMint: priceData.prices?.raw?.near_mint?.tcgplayer || null,
          lightlyPlayed: priceData.prices?.raw?.lightly_played?.tcgplayer || null,
          moderatelyPlayed: priceData.prices?.raw?.moderately_played?.tcgplayer || null,
          heavilyPlayed: priceData.prices?.raw?.heavily_played?.tcgplayer || null,
          damaged: priceData.prices?.raw?.damaged?.tcgplayer || null,
        },
        graded: priceData.prices?.graded || null,
        lastPriceUpdate: priceData.last_price_update,
        // JP-specific fields from search
        hp: null,
        types: [],
        evolution: null,
        skills: [],
        supertype: null,
      })
    }

    if (!cardData) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Merge card data with price data
    const result: any = {
      id: cardData.id || cardId,
      tcgplayerId: priceData?.tcgplayer_id || null,
      name: cardData.name || cardId,
      nameJP: cardData.nameJP || null, // Japanese name from pokemon-card.com
      number: cardData.number || '',
      rarity: cardData.rarity || (priceData?.rarity || null),
      variant: priceData?.variant || null,
      imageUrl: cardData.image || (priceData?.image_url || null),
      setName: cardData.setName || (typeof priceData?.set === 'object' ? priceData.set.name : '') || '',
      setSlug: typeof priceData?.set === 'object' ? (priceData.set as any).slug || '' : '',
      game: 'pokemon-jp',
      // JP-specific fields from pokemon-card.com
      hp: cardData.hp || null,
      types: cardData.types || [],
      evolution: cardData.evolution || null,
      skills: cardData.skills || [],
      supertype: cardData.supertype || null,
    }

    // Add price data if available
    if (priceData) {
      result.prices = {
        nearMint: priceData.prices?.raw?.near_mint?.tcgplayer || null,
        lightlyPlayed: priceData.prices?.raw?.lightly_played?.tcgplayer || null,
        moderatelyPlayed: priceData.prices?.raw?.moderately_played?.tcgplayer || null,
        heavilyPlayed: priceData.prices?.raw?.heavily_played?.tcgplayer || null,
        damaged: priceData.prices?.raw?.damaged?.tcgplayer || null,
      }
      result.graded = priceData.prices?.graded || null
      result.lastPriceUpdate = priceData.last_price_update
    } else {
      result.prices = { nearMint: null, lightlyPlayed: null, moderatelyPlayed: null, heavilyPlayed: null, damaged: null }
      result.graded = null
      result.lastPriceUpdate = null
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error('Pokemon JP card detail error:', e)
    return NextResponse.json({ error: 'Failed to fetch card' }, { status: 500 })
  }
}