import { PokemonCard, PokemonCardsResponse, OnePieceCard, OnePieceCardsResponse, CardGame } from './types'

const POKEMON_API_BASE = 'https://api.pokemontcg.io/v2'

// Pokemon TCG API
export async function searchPokemonCards(
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PokemonCardsResponse> {
  // If query already contains search operators (AND, quotes, colons), use as-is
  // Otherwise wrap in name:"..." for simple name search
  const q = query.includes(':') || query.includes('AND') ? query : `name:"${query}"`

  const params = new URLSearchParams({
    q,
    page: page.toString(),
    pageSize: pageSize.toString(),
    orderBy: 'name',
  })

  const res = await fetch(`${POKEMON_API_BASE}/cards?${params}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  })

  if (!res.ok) {
    throw new Error(`Pokemon API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export async function getPokemonCard(id: string): Promise<PokemonCard> {
  const res = await fetch(`${POKEMON_API_BASE}/cards/${id}`, {
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`Pokemon API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return data.data
}

export async function getPokemonSets(page: number = 1, pageSize: number = 50) {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    orderBy: '-releaseDate',
  })

  const res = await fetch(`${POKEMON_API_BASE}/sets?${params}`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`Pokemon API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

// One Piece Card Game API (using one-piece-api.com via RapidAPI or direct)
// For now, using a simple fetch to the public endpoint
export async function searchOnePieceCards(
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<OnePieceCardsResponse> {
  // Note: One Piece API requires RapidAPI key
  // For MVP, we'll use the Pokemon TCG API's sibling structure
  const ONEPIECE_API_BASE = process.env.ONEPIECE_API_BASE || 'https://one-piece-api.com/api'
  const ONEPIECE_API_KEY = process.env.ONEPIECE_API_KEY || ''

  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    pageSize: pageSize.toString(),
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (ONEPIECE_API_KEY) {
    headers['X-RapidAPI-Key'] = ONEPIECE_API_KEY
  }

  const res = await fetch(`${ONEPIECE_API_BASE}/cards?${params}`, {
    headers,
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`One Piece API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export async function getOnePieceCard(id: string): Promise<OnePieceCard> {
  const ONEPIECE_API_BASE = process.env.ONEPIECE_API_BASE || 'https://one-piece-api.com/api'
  const ONEPIECE_API_KEY = process.env.ONEPIECE_API_KEY || ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (ONEPIECE_API_KEY) {
    headers['X-RapidAPI-Key'] = ONEPIECE_API_KEY
  }

  const res = await fetch(`${ONEPIECE_API_BASE}/cards/${id}`, {
    headers,
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`One Piece API error: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return data.data
}

// Unified search
export async function searchCards(
  game: CardGame,
  query: string,
  page: number = 1,
  pageSize: number = 20
) {
  if (game === 'pokemon') {
    return searchPokemonCards(query, page, pageSize)
  } else {
    return searchOnePieceCards(query, page, pageSize)
  }
}

// Price helper
export function getCardPrice(card: PokemonCard): {
  low: number | null
  mid: number | null
  high: number | null
  market: number | null
} | null {
  const prices = card.tcgplayer?.prices
  if (!prices) return null

  // Try normal, then holofoil, then reverseHolofoil
  const priceData = prices.normal || prices.holofoil || prices['1stEditionHolofoil'] || prices.reverseHolofoil

  if (!priceData) return null

  return {
    low: priceData.low ?? priceData.reverseHoloLow ?? null,
    mid: priceData.mid ?? priceData.reverseHoloMid ?? null,
    high: priceData.high ?? priceData.reverseHoloHigh ?? null,
    market: priceData.market ?? priceData.reverseHoloMarket ?? null,
  }
}

// Condition labels
export const CONDITION_LABELS: Record<string, string> = {
  mint: 'Mint (M)',
  near_mint: 'Near Mint (NM)',
  excellent: 'Excellent (EX)',
  good: 'Good (GD)',
  light_played: 'Lightly Played (LP)',
  played: 'Played (PL)',
  poor: 'Poor (PR)',
}

export const CONDITION_COLORS: Record<string, string> = {
  mint: 'text-emerald-400',
  near_mint: 'text-green-400',
  excellent: 'text-lime-400',
  good: 'text-yellow-400',
  light_played: 'text-orange-400',
  played: 'text-red-400',
  poor: 'text-red-600',
}

export const GAME_LABELS: Record<CardGame, string> = {
  pokemon: 'Pokemon',
  onepiece: 'One Piece',
}

export const GAME_COLORS: Record<CardGame, string> = {
  pokemon: 'from-yellow-400 to-red-500',
  onepiece: 'from-red-500 to-amber-500',
}