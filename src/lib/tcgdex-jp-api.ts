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
 * 
 * Search strategy:
 * 1. If Japanese keyword → search TCGdex JP directly
 * 2. If English keyword → translate via PokeAPI to JP name → search TCGdex JP
 * 3. Also try searching TCGdex JP with English keyword (catches some cards)
 */

import { getJapanesePokemonName } from './pokemon-jp-names'

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

const TCGDEX_JP = 'https://api.tcgdex.net/v2/ja'

/**
 * Get the full image URL for a card
 */
export function getJPImageUrl(baseImageUrl: string, quality: 'high' | 'low' = 'high'): string {
  return `${baseImageUrl}/${quality}.webp`
}

/**
 * Check if a string contains Japanese characters
 */
function isJapanese(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text)
}

/**
 * Search for Japanese Pokemon cards by name (supports EN and JP keywords)
 */
export async function searchPokemonJPCardsTCGdex(
  keyword: string,
  page: number = 1,
): Promise<{ data: TCGdexJPCard[]; totalCount: number; page: number }> {
  if (!keyword.trim()) {
    return { data: [], totalCount: 0, page }
  }

  const allCards: TCGdexJPCard[] = []
  const seenIds = new Set<string>()

  console.log(`[TCGdex JP] Starting search for: "${keyword}" (isJapanese: ${isJapanese(keyword)})`)

  if (isJapanese(keyword)) {
    // Strategy 1: Japanese keyword — search TCGdex JP directly
    const results = await searchTCGdexJP(keyword)
    console.log(`[TCGdex JP] Direct JP search returned ${results.length} results`)
    for (const card of results) {
      if (!seenIds.has(card.id)) {
        seenIds.add(card.id)
        allCards.push(card)
      }
    }
  } else {
    // Strategy 2: English keyword — run JP search + EN-to-JP translation in parallel
    const searchPromises: Promise<void>[] = []

    // Step A: Search TCGdex JP directly with English keyword
    // (catches some cards that have English names in the JP database)
    searchPromises.push(
      searchTCGdexJP(keyword).then(results => {
        console.log(`[TCGdex JP] Direct EN→JP search returned ${results.length} results`)
        for (const card of results) {
          if (!seenIds.has(card.id)) {
            seenIds.add(card.id)
            allCards.push(card)
          }
        }
      }).catch(e => console.error('[TCGdex JP] Direct search failed:', e))
    )

    // Step B: Translate to Japanese via PokeAPI, then search
    searchPromises.push(
      getJapanesePokemonName(keyword).then(async jpName => {
        if (jpName && jpName !== keyword) {
          console.log(`[TCGdex JP] PokeAPI translation: "${keyword}" → "${jpName}"`)
          const jpResults = await searchTCGdexJP(jpName)
          console.log(`[TCGdex JP] JP search for "${jpName}" returned ${jpResults.length} results`)
          for (const card of jpResults) {
            if (!seenIds.has(card.id)) {
              seenIds.add(card.id)
              allCards.push(card)
            }
          }
        }
      }).catch(e => console.error('[TCGdex JP] PokeAPI translation failed:', e))
    )

    // Wait for both searches to complete (parallel)
    await Promise.all(searchPromises)
  }

  // Filter to only Pokemon category
  const pokemonCards = allCards.filter(c => c.category === 'Pokemon')

  console.log(`[TCGdex JP] Search "${keyword}" → found ${pokemonCards.length} Pokemon cards (total candidates: ${allCards.length})`)
  return { data: pokemonCards, totalCount: pokemonCards.length, page }
}

/**
 * Convert EN card ID to potential JP card ID
 * EN: "sv1-1" → JP: "SV1-001"
 * EN: "sv2d-17" → JP: "SV2D-017"
 * Note: Not all EN cards have JP equivalents and ID formats don't always match
 */
function convertENtoJPId(enId: string): string | null {
  const match = enId.match(/^([a-z]+?)(\d+[a-z]?)-(\d+)$/i)
  if (!match) return null
  
  const setPrefix = match[1].toUpperCase()
  const cardNum = match[3].padStart(3, '0')
  
  return `${setPrefix}-${cardNum}`
}

/**
 * Search TCGdex JP API directly
 */
export async function searchTCGdexJP(keyword: string): Promise<TCGdexJPCard[]> {
  const url = `${TCGDEX_JP}/cards?name=${encodeURIComponent(keyword)}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TCGVault/1.0',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`[TCGdex JP] Search HTTP ${response.status} for: ${keyword}`)
      return []
    }

    const data = await response.json()
    if (!Array.isArray(data)) return []
    return data
  } catch (error) {
    console.error('[TCGdex JP] Search error:', error)
    return []
  }
}

/**
 * Search TCGdex EN API (returns raw results for cross-referencing)
 */
async function searchTCGdexEN(keyword: string): Promise<any[]> {
  const url = `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(keyword)}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TCGVault/1.0',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) return []
    
    const data = await response.json()
    if (!Array.isArray(data)) return []
    return data.filter((c: any) => c.category === 'Pokemon')
  } catch (error) {
    console.error('[TCGdex EN] Search error:', error)
    return []
  }
}

/**
 * Get a specific Japanese Pokemon card by ID
 */
export async function getPokemonJPCardTCGdex(cardId: string): Promise<TCGdexJPCard | null> {
  const url = `${TCGDEX_JP}/cards/${cardId}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TCGVault/1.0',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[TCGdex JP] Fetch error:', error)
    return null
  }
}

/**
 * Get all Japanese sets
 */
export async function getJPSets(): Promise<any[]> {
  const url = `${TCGDEX_JP}/sets`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TCGVault/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Sets rarely change, cache 1 hour
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