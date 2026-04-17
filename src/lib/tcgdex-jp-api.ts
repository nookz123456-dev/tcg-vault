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
 * Search strategy: TCGdex JP only accepts Japanese names,
 * so we use PokeAPI to translate English → Japanese first,
 * then search TCGdex. If the keyword is already Japanese,
 * we search TCGdex directly.
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

const TCGDEX_BASE = 'https://api.tcgdex.net/v2/ja'

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
  // Check for hiragana, katakana, or kanji ranges
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

  // Strategy 1: If keyword is Japanese, search TCGdex directly
  if (isJapanese(keyword)) {
    const jpResults = await searchTCGdex(keyword)
    for (const card of jpResults) {
      if (!seenIds.has(card.id)) {
        seenIds.add(card.id)
        allCards.push(card)
      }
    }
  } else {
    // Strategy 2: English keyword — translate to Japanese via PokeAPI, then search both
    const jpName = await getJapanesePokemonName(keyword)
    
    if (jpName) {
      // Search with Japanese name (primary)
      const jpResults = await searchTCGdex(jpName)
      for (const card of jpResults) {
        if (!seenIds.has(card.id)) {
          seenIds.add(card.id)
          allCards.push(card)
        }
      }
    }

    // Also search TCGdex EN API and cross-reference
    // This helps find cards when PokeAPI doesn't have the name
    const enResults = await searchTCGdexEN(keyword)
    for (const card of enResults) {
      if (!seenIds.has(card.id)) {
        seenIds.add(card.id)
        allCards.push(card)
      }
    }
  }

  // Filter to only Pokemon category
  const pokemonCards = allCards.filter(c => c.category === 'Pokemon')

  console.log(`[TCGdex JP] Search "${keyword}" → found ${pokemonCards.length} Pokemon cards`)
  return { data: pokemonCards, totalCount: pokemonCards.length, page }
}

/**
 * Search TCGdex JP API directly
 */
async function searchTCGdex(keyword: string): Promise<TCGdexJPCard[]> {
  const url = `${TCGDEX_BASE}/cards?name:${encodeURIComponent(keyword)}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TCGVault/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error('[TCGdex JP] Search error:', error)
    return []
  }
}

/**
 * Search TCGdex EN API and return JP-matched cards
 * This helps when user searches in English — we find the card in EN,
 * then look up the same card in JP database
 */
async function searchTCGdexEN(keyword: string): Promise<TCGdexJPCard[]> {
  const enBase = 'https://api.tcgdex.net/v2/en'
  const url = `${enBase}/cards?name:${encodeURIComponent(keyword)}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TCGVault/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) return []
    
    const enCards: any[] = await response.json()
    
    // For each EN card found, try to look up its JP equivalent
    // EN cards have IDs like "sv1-1" — JP cards have IDs like "SV1-001"
    // We need to find the JP version by matching set + localId
    const jpCards: TCGdexJPCard[] = []
    
    // Take top 10 unique set IDs from EN results
    const seenSetIds = new Set<string>()
    const topEnCards = enCards
      .filter(c => c.category === 'Pokemon')
      .slice(0, 20)
    
    for (const enCard of topEnCards) {
      // Parse the EN card's set to find JP equivalent
      // EN format: "sv1-1" → set="sv1", localId="1"  
      // JP format: "SV1-001" → we need to search the JP set
      const setId = enCard.set?.id
      if (!setId || seenSetIds.has(setId)) continue
      seenSetIds.add(setId)
      
      // Search JP set for this card by localId
      const jpCard = await fetchJPCardBySetAndLocalId(setId.toUpperCase(), enCard.localId)
      if (jpCard && !jpCards.find(c => c.id === jpCard.id)) {
        jpCards.push(jpCard)
      }
    }
    
    return jpCards
  } catch (error) {
    console.error('[TCGdex EN] Search error:', error)
    return []
  }
}

/**
 * Fetch a JP card by set ID and local card number
 */
async function fetchJPCardBySetAndLocalId(setId: string, localId: string): Promise<TCGdexJPCard | null> {
  // TCGdex JP uses uppercase set IDs like "SV1", "SV2D", etc.
  // localId in EN is like "1" but in JP it's like "001"
  const paddedLocalId = localId.padStart(3, '0')
  const cardId = `${setId}-${paddedLocalId}`
  
  return getPokemonJPCardTCGdex(cardId)
}

/**
 * Get a specific Japanese Pokemon card by ID
 */
export async function getPokemonJPCardTCGdex(cardId: string): Promise<TCGdexJPCard | null> {
  const url = `${TCGDEX_BASE}/cards/${cardId}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TCGVault/1.0',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      console.error(`[TCGdex JP] Card ${cardId} not found (${response.status})`)
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