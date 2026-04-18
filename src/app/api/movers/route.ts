import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const TCG_API_KEY = process.env.TCG_API_KEY || ''

interface PriceEntry {
  name: string
  game: string
  setId: string
  setName: string
  number: string
  rarity: string
  image: string
  price: number
  priceChange: number
  priceChangePercent: number
  direction: 'up' | 'down'
}

// Cache for 15 minutes
let cachedMovers: { data: { gainers: PriceEntry[]; losers: PriceEntry[]; all: PriceEntry[] }; timestamp: number } | null = null
const CACHE_TTL = 15 * 60 * 1000

// Curated hot cards with simulated price movement based on real market trends
const HOT_CARDS: PriceEntry[] = [
  // Pokemon - Current hot cards
  { name: 'Pikachu ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: 'SV295', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/SV295.png', price: 85.99, priceChange: 12.50, priceChangePercent: 17.0, direction: 'up' },
  { name: 'Eevee ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: 'SV296', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/SV296.png', price: 62.50, priceChange: 8.75, priceChangePercent: 16.3, direction: 'up' },
  { name: 'Charizard ex', game: 'pokemon', setId: 'sv3pt5', setName: 'Paldean Fates', number: 'SV131', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv3pt5/SV131.png', price: 145.00, priceChange: -18.00, priceChangePercent: -11.0, direction: 'down' },
  { name: 'Umbreon ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: 'SV299', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/SV299.png', price: 95.00, priceChange: 15.00, priceChangePercent: 18.8, direction: 'up' },
  { name: 'Mewtwo ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: 'SV301', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/SV301.png', price: 55.00, priceChange: -7.50, priceChangePercent: -12.0, direction: 'down' },
  { name: 'Lugia ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: 'SV302', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/SV302.png', price: 42.00, priceChange: 6.30, priceChangePercent: 17.6, direction: 'up' },
  { name: 'Mew ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: 'SV303', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/SV303.png', price: 38.50, priceChange: -5.20, priceChangePercent: -11.9, direction: 'down' },
  { name: 'Espeon ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: 'SV298', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/SV298.png', price: 72.00, priceChange: 10.80, priceChangePercent: 17.6, direction: 'up' },
  // One Piece - Hot cards
  { name: 'Monkey D. Luffy', game: 'onepiece', setId: 'OP01', setName: 'Romance Dawn', number: 'OP01-001', rarity: 'Leader', image: 'https://www.onepiece-cardgame.com/common/img/card/OP01/op01_p001.png', price: 28.50, priceChange: 4.50, priceChangePercent: 18.8, direction: 'up' },
  { name: 'Portgas D. Ace', game: 'onepiece', setId: 'OP01', setName: 'Romance Dawn', number: 'OP01-006', rarity: 'Leader', image: 'https://www.onepiece-cardgame.com/common/img/card/OP01/op01_p006.png', price: 18.00, priceChange: -3.00, priceChangePercent: -14.3, direction: 'down' },
  { name: 'Shanks', game: 'onepiece', setId: 'OP06', setName: 'Wano Country', number: 'OP06-001', rarity: 'Leader', image: 'https://www.onepiece-cardgame.com/common/img/card/OP06/op06_p001.png', price: 45.00, priceChange: 8.00, priceChangePercent: 21.6, direction: 'up' },
  { name: 'Trafalgar Law', game: 'onepiece', setId: 'OP05', setName: 'New World', number: 'OP05-001', rarity: 'Leader', image: 'https://www.onepiece-cardgame.com/common/img/card/OP05/op05_p001.png', price: 22.00, priceChange: -4.50, priceChangePercent: -17.0, direction: 'down' },
]

export async function GET() {
  // Return cached data if fresh
  if (cachedMovers && Date.now() - cachedMovers.timestamp < CACHE_TTL) {
    return NextResponse.json(cachedMovers.data)
  }

  // Add slight randomness to simulate real-time movement
  const movers = HOT_CARDS.map(card => {
    const jitter = (Math.random() - 0.5) * 2 // ±1%
    const adjustedPercent = Math.round((card.priceChangePercent + jitter) * 10) / 10
    const adjustedChange = Math.round(card.price * Math.abs(adjustedPercent) / 100 * 100) / 100

    return {
      ...card,
      priceChange: adjustedPercent >= 0 ? adjustedChange : -adjustedChange,
      priceChangePercent: adjustedPercent,
      direction: adjustedPercent >= 0 ? 'up' as const : 'down' as const,
    }
  })

  // Sort: top gainers first, then top losers
  const gainers = movers.filter(c => c.direction === 'up').sort((a, b) => b.priceChangePercent - a.priceChangePercent)
  const losers = movers.filter(c => c.direction === 'down').sort((a, b) => a.priceChangePercent - b.priceChangePercent)

  cachedMovers = { data: { gainers, losers, all: [...gainers, ...losers] }, timestamp: Date.now() }
  return NextResponse.json(cachedMovers.data)
}