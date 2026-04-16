import { NextResponse } from 'next/server'
import { getPokemonCard } from '@/lib/api'
import { PokemonCard } from '@/lib/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const card: PokemonCard = await getPokemonCard(id)

    // Extract all price tiers
    const allPrices = card.tcgplayer?.prices || {}
    const cmPrices = card.cardmarket?.prices

    // Build graded-style price breakdown
    const priceBreakdown: Array<{
      key: string
      label: string
      prices: {
        low: number | null
        mid: number | null
        high: number | null
        market: number | null
        directLow: number | null
      }
    }> = []

    // Variant labels
    const VARIANT_LABELS: Record<string, string> = {
      normal: 'Ungraded',
      holofoil: 'Holofoil',
      reverseHolofoil: 'Reverse Holo',
      '1stEditionHolofoil': '1st Edition Holo',
      '1stEditionNormal': '1st Edition',
    }

    for (const [variant, data] of Object.entries(allPrices)) {
      if (data && typeof data === 'object') {
        priceBreakdown.push({
          key: variant,
          label: VARIANT_LABELS[variant] || variant,
          prices: {
            low: data.low ?? null,
            mid: data.mid ?? null,
            high: data.high ?? null,
            market: data.market ?? null,
            directLow: data.directLow ?? null,
          },
        })
      }
    }

    // CardMarket data
    const cardmarketData = cmPrices ? {
      averageSellPrice: cmPrices.averageSellPrice ?? null,
      lowPrice: cmPrices.lowPrice ?? null,
      trendPrice: cmPrices.trendPrice ?? null,
      suggestedPrice: cmPrices.suggestedPrice ?? null,
      germanProLow: cmPrices.germanProLow ?? null,
      avg1: cmPrices.avg1 ?? null,
      avg7: cmPrices.avg7 ?? null,
      avg30: cmPrices.avg30 ?? null,
      reverseHoloSell: cmPrices.reverseHoloSell ?? null,
      reverseHoloLow: cmPrices.reverseHoloLow ?? null,
      reverseHoloTrend: cmPrices.reverseHoloTrend ?? null,
      reverseHoloAvg1: cmPrices.reverseHoloAvg1 ?? null,
      reverseHoloAvg7: cmPrices.reverseHoloAvg7 ?? null,
      reverseHoloAvg30: cmPrices.reverseHoloAvg30 ?? null,
    } : null

    return NextResponse.json({
      id: card.id,
      name: card.name,
      supertype: card.supertype,
      subtypes: card.subtypes,
      hp: card.hp,
      types: card.types,
      evolveFrom: card.evolveFrom,
      rarity: card.rarity,
      set: card.set,
      number: card.number,
      artist: card.artist,
      flavorText: card.flavorText,
      images: card.images,
      attacks: card.attacks,
      abilities: card.abilities,
      weaknesses: card.weaknesses,
      resistances: card.resistances,
      retreatCost: card.retreatCost,
      legalities: card.legalities,
      nationalPokedexNumbers: card.nationalPokedexNumbers,
      tcgplayer: {
        url: card.tcgplayer?.url ?? null,
        updatedAt: card.tcgplayer?.updatedAt ?? null,
      },
      priceBreakdown,
      cardmarket: cardmarketData,
      cardmarketUrl: card.cardmarket?.url ?? null,
      cardmarketUpdatedAt: card.cardmarket?.updatedAt ?? null,
    })
  } catch (error) {
    console.error('Card detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch card details' },
      { status: 500 }
    )
  }
}