import { NextResponse } from 'next/server'
import { searchPokemonCards, getCardPrice } from '@/lib/api'

// Trending cards — mix of popular Pokemon + One Piece with current prices

const TRENDING_POKEMON_QUERIES = [
  // Highest market price cards in Scarlet & Violet
  'set.series:"Scarlet & Violet" supertype:"Pokemon" -subtypes:"BREAK" -subtypes:"MEGA" -subtypes:"V-UNION"',
  // Special Illustration Rares (chase cards, high value)
  'rarity:"Special Illustration Rare"',
  // Illustration Rares
  'rarity:"Illustration Rare"',
]

interface TrendingCard {
  id: string
  name: string
  image: string
  game: 'pokemon' | 'onepiece'
  setName: string
  rarity: string
  marketPrice: number | null
}

export async function GET() {
  const cards: TrendingCard[] = []
  const seen = new Set<string>()

  try {
    // Fetch trending Pokemon cards with prices (multiple queries for variety)
    for (const q of TRENDING_POKEMON_QUERIES) {
      if (cards.length >= 8) break
      const results = await searchPokemonCards(q, 1, 8)
      // Sort by market price descending, pick highest value cards
      const withPrices = results.data
        .map(card => {
          const price = getCardPrice(card)
          return { card, market: price?.market ?? 0 }
        })
        .filter(c => c.market > 50) // Only cards priced $50+
        .sort((a, b) => b.market - a.market)

      for (const { card, market } of withPrices) {
        if (cards.length >= 8) break
        if (seen.has(card.id)) continue
        seen.add(card.id)
        cards.push({
          id: card.id,
          name: card.name,
          image: card.images.small,
          game: 'pokemon',
          setName: card.set.name,
          rarity: card.rarity || '',
          marketPrice: market,
        })
      }
    }
  } catch (e) {
    console.error('Failed to fetch trending Pokemon cards:', e)
  }

  // Add One Piece cards (static — scraping too slow for homepage)
  // Images go through /api/proxy-image to bypass Bandai hotlink protection
  const onePieceCards: TrendingCard[] = [
    {
      id: 'op-st01-001',
      name: 'Monkey.D.Luffy',
      image: '/api/proxy-image?url=' + encodeURIComponent('https://www.onepiece-cardgame.com/images/cardlist/card/ST01-001.png'),
      game: 'onepiece',
      setName: 'Straw Hat Crew',
      rarity: 'L',
      marketPrice: null,
    },
    {
      id: 'op-op02-001',
      name: 'Monkey.D.Luffy',
      image: '/api/proxy-image?url=' + encodeURIComponent('https://www.onepiece-cardgame.com/images/cardlist/card/OP02-001.png'),
      game: 'onepiece',
      setName: 'Paramount War',
      rarity: 'SEC',
      marketPrice: null,
    },
  ]

  cards.push(...onePieceCards)

  return NextResponse.json({ cards: cards.slice(0, 10) })
}