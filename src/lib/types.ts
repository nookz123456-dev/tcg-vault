// Pokemon TCG API types
export interface PokemonCard {
  id: string
  name: string
  supertype: string
  subtypes: string[]
  hp?: string
  types?: string[]
  evolveFrom?: string
  abilities?: Array<{ name: string; text: string; type: string }>
  attacks?: Array<{ name: string; cost: string[]; convertedEnergyCost: number; damage: string; text: string }>
  weaknesses?: Array<{ type: string; value: string }>
  resistances?: Array<{ type: string; value: string }>
  retreatCost?: string[]
  set: {
    id: string
    name: string
    series: string
    printedTotal: number
    total: number
    releaseDate: string
  }
  number: string
  artist: string
  rarity?: string
  flavorText?: string
  nationalPokedexNumbers?: number[]
  legalities?: Record<string, { legal: string }>
  images: {
    small: string
    large: string
  }
  tcgplayer?: {
    url: string
    updatedAt: string
    prices?: Record<string, {
      low: number | null
      mid: number | null
      high: number | null
      market: number | null
      directLow: number | null
      reverseHoloLow: number | null
      reverseHoloMid: number | null
      reverseHoloHigh: number | null
      reverseHoloMarket: number | null
    }>
  }
  cardmarket?: {
    url: string
    updatedAt: string
    prices?: Record<string, {
      averageSellPrice: number
      lowPrice: number
      trendPrice: number
      germanProLow: number
      suggestedPrice: number
      reverseHoloSell: number
      reverseHoloLow: number
      reverseHoloTrend: number
      lowPriceExPlus: number
      avg1: number
      avg7: number
      avg30: number
      reverseHoloAvg1: number
      reverseHoloAvg7: number
      reverseHoloAvg30: number
    }>
  }
}

export interface PokemonCardsResponse {
  data: PokemonCard[]
  page: number
  pageSize: number
  count: number
  totalCount: number
}

// One Piece Card Game types
export interface OnePieceCard {
  id: string
  name: string
  card_number: string
  category: string
  color: string[]
  cost: number | null
  counter: number | null
  attribute: string | null
  power: number | null
  life: number | null
  type: string[]
  effect: string
  trigger: string | null
  set: {
    id: string
    name: string
    series: string
  }
  rarity: string
  artist: string | null
  images: {
    small: string
    large: string
  }
}

export interface OnePieceCardsResponse {
  data: OnePieceCard[]
  page: number
  pageSize: number
  count: number
  totalCount: number
}

// Collection types
export type CardGame = 'pokemon' | 'onepiece'

export type CardCondition = 
  | 'mint'
  | 'near_mint'
  | 'excellent'
  | 'good'
  | 'light_played'
  | 'played'
  | 'poor'

export interface CollectionCard {
  id: string
  collection_id: string
  card_id: string
  game: CardGame
  quantity: number
  condition: CardCondition
  grade: string | null
  purchase_price: number | null
  acquired_date: string | null
  notes: string | null
  created_at: string
  // Joined from API
  card_data?: PokemonCard | OnePieceCard
  current_price?: number
}

export interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  created_at: string
  card_count?: number
  total_value?: number
}

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}