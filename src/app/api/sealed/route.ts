import { NextResponse } from 'next/server'

const POKEMON_API_BASE = 'https://api.pokemontcg.io/v2'

interface SealedProduct {
  id: string
  name: string
  series: string
  releaseDate: string
  images: { symbol: string; logo: string }
  printedTotal: number
  total: number
  updatedAt: string
}

export async function GET() {
  try {
    // Fetch latest sets (sealed products = booster boxes, ETBs per set)
    const res = await fetch(`${POKEMON_API_BASE}/sets?orderBy=-releaseDate&pageSize=12`, {
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      throw new Error(`Pokemon API error: ${res.status}`)
    }

    const data = await res.json()
    const sets = data.data as Array<{
      id: string
      name: string
      series: string
      releaseDate: string
      images: { symbol: string; logo: string }
      printedTotal: number
      total: number
      updatedAt: string
    }>

    // Map sets to sealed products with estimated prices
    // Pokemon TCG API doesn't have sealed product prices directly
    // but we can show set info + link to TCGplayer for prices
    const products = sets.map(set => ({
      id: set.id,
      name: set.name,
      series: set.series,
      releaseDate: set.releaseDate,
      logo: set.images.logo,
      symbol: set.images.symbol,
      printedTotal: set.printedTotal,
      total: set.total,
      updatedAt: set.updatedAt,
      // Generate common sealed product types
      products: [
        { type: 'Booster Box', url: `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(set.name + ' booster box')}` },
        { type: 'Elite Trainer Box', url: `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(set.name + ' elite trainer box')}` },
        { type: 'Booster Pack', url: `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(set.name + ' booster pack')}` },
      ],
    }))

    return NextResponse.json({ products })
  } catch (e) {
    console.error('Failed to fetch sealed products:', e)
    return NextResponse.json({ error: 'Failed to fetch sealed products' }, { status: 500 })
  }
}