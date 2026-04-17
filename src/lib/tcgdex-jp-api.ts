/**
 * Pokemon JP Card API via TCGdex
 * 
 * TCGdex provides Japanese Pokemon card data with:
 * - Japanese card names (ピカチュウ, リザードン, etc.)
 * - Japanese attack names (なきごえ, ピカボルト, etc.)
 * - High-quality Japanese card images
 * - CardMarket pricing in EUR
 * - Full card metadata (HP, types, attacks, weakness, retreat, etc.)
 * 
 * API: https://api.tcgdex.net/v2/ja/
 * Assets: https://assets.tcgdex.net/ja/{set}/{localId}/high.webp
 */

export interface TCGdexJPCard {
  id: string
  localId: string
  name: string // Japanese name
  image: string // Base image URL (add /high.webp for full image)
  category: string
  hp?: number
  types?: string[]
  stage?: string
  attacks?: {
    cost: string[]
    name: string
    damage?: string
    effect?: string
  }[]
  weaknesses?: { type: string; value: string }[]
  resistances?: { type: string; value: string }[]
  retreat?: number
  description?: string
  illustrator?: string
  rarity?: string
  set: {
    id: string
    name: string
    cardCount: { official: number; total: number }
  }
  variants?: {
    firstEdition: boolean
    holo: boolean
    normal: boolean
    reverse: boolean
    wPromo: boolean
  }
  dexId?: number[]
  pricing?: {
    cardmarket?: {
      unit: string
      avg: number
      low: number
      trend: number
      avg1: number
      avg7: number
      avg30: number
    }
  }
  legal?: { standard: boolean; expanded: boolean }
  regulationMark?: string
  updated?: string
}

const TCGDEX_BASE = 'https://api.tcgdex.net/v2/ja'

/**
 * Get the full image URL for a card
 */
export function getJPImageUrl(baseImageUrl: string, quality: 'high' | 'low' = 'high'): string {
  return `${baseImageUrl}/${quality}.webp`
}

/**
 * Search for Japanese Pokemon cards by name
 */
export async function searchPokemonJPCardsTCGdex(
  keyword: string,
  page: number = 1,
): Promise<{ data: TCGdexJPCard[]; totalCount: number; page: number }> {
  // TCGdex search endpoint
  const url = `${TCGDEX_BASE}/cards?name:${encodeURIComponent(keyword)}`
  
  console.log(`[TCGdex JP] Searching: ${url}`)
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TCGVault/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      console.error(`[TCGdex JP] HTTP ${response.status}`)
      return { data: [], totalCount: 0, page }
    }

    const cards: TCGdexJPCard[] = await response.json()
    
    // Filter to only Pokemon category
    const pokemonCards = cards.filter(c => c.category === 'Pokemon')
    
    console.log(`[TCGdex JP] Found ${pokemonCards.length} Pokemon cards`)
    return { data: pokemonCards, totalCount: pokemonCards.length, page }
  } catch (error) {
    console.error(`[TCGdex JP] Search error:`, error)
    return { data: [], totalCount: 0, page }
  }
}

/**
 * Get a specific Japanese Pokemon card by ID
 */
export async function getPokemonJPCardTCGdex(cardId: string): Promise<TCGdexJPCard | null> {
  const url = `${TCGDEX_BASE}/cards/${cardId}`
  
  console.log(`[TCGdex JP] Fetching: ${url}`)
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TCGVault/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      console.error(`[TCGdex JP] HTTP ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`[TCGdex JP] Fetch error:`, error)
    return null
  }
}

/**
 * Get all Japanese sets
 */
export async function getJPSets(): Promise<any[]> {
  const url = `${TCGDEX_BASE}/sets`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TCGVault/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 86400 },
    })

    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

/**
 * Convert TCGdex type names to English
 */
const TYPE_MAP: Record<string, string> = {
  Colorless: 'Colorless',
  Fighting: 'Fighting',
  Flying: 'Flying',
  Poison: 'Poison',
  Ground: 'Ground',
  Rock: 'Rock',
  Bug: 'Bug',
  Ghost: 'Ghost',
  Steel: 'Metal',
  Fire: 'Fire',
  Water: 'Water',
  Grass: 'Grass',
  Lightning: 'Lightning',
  Psychic: 'Psychic',
  Ice: 'Ice',
  Dragon: 'Dragon',
  Dark: 'Darkness',
  Fairy: 'Fairy',
}

export function mapType(type: string): string {
  return TYPE_MAP[type] || type
}