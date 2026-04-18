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
// Pokemon images: use regular card numbers from images.pokemontcg.io
// One Piece images: proxied through /api/proxy-image from optcgapi.com
const HOT_CARDS: PriceEntry[] = [
  // Pokemon - Gainers (12 cards)
  { name: 'Pikachu ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: '4', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/4.png', price: 85.99, priceChange: 12.50, priceChangePercent: 17.0, direction: 'up' },
  { name: 'Eevee ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: '5', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/5.png', price: 62.50, priceChange: 8.75, priceChangePercent: 16.3, direction: 'up' },
  { name: 'Umbreon ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: '6', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/6.png', price: 95.00, priceChange: 15.00, priceChangePercent: 18.8, direction: 'up' },
  { name: 'Lugia ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: '8', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/8.png', price: 42.00, priceChange: 6.30, priceChangePercent: 17.6, direction: 'up' },
  { name: 'Espeon ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: '10', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/10.png', price: 72.00, priceChange: 10.80, priceChangePercent: 17.6, direction: 'up' },
  { name: 'Gardevoir ex', game: 'pokemon', setId: 'sv7', setName: 'Stellar Crown', number: '3', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv7/3.png', price: 48.00, priceChange: 7.20, priceChangePercent: 17.6, direction: 'up' },
  { name: 'Rayquaza ex', game: 'pokemon', setId: 'sv7', setName: 'Stellar Crown', number: '30', rarity: 'Ultra Rare', image: 'https://images.pokemontcg.io/sv7/30.png', price: 55.00, priceChange: 9.90, priceChangePercent: 22.0, direction: 'up' },
  { name: 'Sylveon ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: '12', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/12.png', price: 58.00, priceChange: 8.70, priceChangePercent: 17.6, direction: 'up' },
  { name: 'Glaceon ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: '11', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/11.png', price: 45.00, priceChange: 6.75, priceChangePercent: 17.6, direction: 'up' },
  { name: 'Leafeon ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: '9', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/9.png', price: 38.00, priceChange: 5.70, priceChangePercent: 17.6, direction: 'up' },
  // One Piece - Gainers (2 cards)
  { name: 'Monkey D. Luffy', game: 'onepiece', setId: 'OP01', setName: 'Romance Dawn', number: '001', rarity: 'Leader', image: '/api/proxy-image?url=https://optcgapi.com/images/cards/en/OP01-001.png', price: 32.50, priceChange: 4.88, priceChangePercent: 17.6, direction: 'up' },
  { name: 'Roronoa Zoro', game: 'onepiece', setId: 'OP01', setName: 'Romance Dawn', number: '022', rarity: 'Super Rare', image: '/api/proxy-image?url=https://optcgapi.com/images/cards/en/OP01-022.png', price: 28.00, priceChange: 3.92, priceChangePercent: 16.3, direction: 'up' },
  // Pokemon - Losers (8 cards)
  { name: 'Charizard ex', game: 'pokemon', setId: 'sv3pt5', setName: 'Paldean Fates', number: '2', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv3pt5/2.png', price: 145.00, priceChange: -18.00, priceChangePercent: -11.0, direction: 'down' },
  { name: 'Mewtwo ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: '7', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/7.png', price: 55.00, priceChange: -7.50, priceChangePercent: -12.0, direction: 'down' },
  { name: 'Mew ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: '20', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8pt5/20.png', price: 38.50, priceChange: -5.20, priceChangePercent: -11.9, direction: 'down' },
  { name: 'Gengar ex', game: 'pokemon', setId: 'sv6', setName: 'Twilight Masquerade', number: '40', rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv6/40.png', price: 35.00, priceChange: -4.50, priceChangePercent: -11.4, direction: 'down' },
  { name: 'Dragonite ex', game: 'pokemon', setId: 'sv6', setName: 'Twilight Masquerade', number: '50', rarity: 'Ultra Rare', image: 'https://images.pokemontcg.io/sv6/50.png', price: 28.00, priceChange: -3.50, priceChangePercent: -11.1, direction: 'down' },
  { name: 'Vaporeon ex', game: 'pokemon', setId: 'sv8pt5', setName: 'Prismatic Evolutions', number: '13', rarity: 'Ultra Rare', image: 'https://images.pokemontcg.io/sv8pt5/13.png', price: 25.00, priceChange: -3.25, priceChangePercent: -11.5, direction: 'down' },
  // One Piece - Losers (2 cards)
  { name: 'Nami', game: 'onepiece', setId: 'OP01', setName: 'Romance Dawn', number: '009', rarity: 'Rare', image: '/api/proxy-image?url=https://optcgapi.com/images/cards/en/OP01-009.png', price: 15.00, priceChange: -1.80, priceChangePercent: -10.7, direction: 'down' },
  { name: 'Sanji', game: 'onepiece', setId: 'OP02', setName: 'Paramount War', number: '018', rarity: 'Super Rare', image: '/api/proxy-image?url=https://optcgapi.com/images/cards/en/OP02-018.png', price: 22.00, priceChange: -2.86, priceChangePercent: -11.5, direction: 'down' },
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