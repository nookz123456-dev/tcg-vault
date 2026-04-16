import { NextResponse } from 'next/server'
import { searchPokemonCards, getCardPrice } from '@/lib/api'

// Trending cards — mix of popular Pokemon + One Piece with current prices

const TRENDING_POKEMON_QUERIES = [
  // High-value Scarlet & Violet cards
  'set.series:"Scarlet & Violet" rarity:"Ultra Rare"',
  // Special Illustration Rares (the chase cards)
  'rarity:"Special Illustration Rare"',
  // Rare Ultra across all sets
  'rarity:"Rare Ultra"',
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
      // Shuffle and pick cards with prices
      const shuffled = results.data.sort(() => Math.random() - 0.5)
      for (const card of shuffled) {
        if (cards.length >= 8) break
        if (seen.has(card.id)) continue
        const price = getCardPrice(card)
        if (price && price.market && price.market > 1) {
          seen.add(card.id)
          cards.push({
            id: card.id,
            name: card.name,
            image: card.images.small,
            game: 'pokemon',
            setName: card.set.name,
            rarity: card.rarity || '',
            marketPrice: price.market,
          })
        }
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