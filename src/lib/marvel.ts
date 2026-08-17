// Marvel Hero Rush — local dataset access + display metadata.
// Data is static (267 cards) and lives in marvel-data.json; prices are
// admin-set and stored in Supabase (see getMarvelPrices / marvel_card_prices).
import data from './marvel-data.json'

export interface MarvelCard {
  id: string
  cardNo: string
  name: string
  attribute: string | null
  cardType: string
  level: number | null
  power: number | null
  attackRange: number | null
  rarity: string
  feature: string | null
  effect: string
  environment: string
  series: string
  image: string
  imageKey: string | null
}

export interface MarvelSet {
  id: string
  name: string
  code: string
  kind: string
  total: number
}

export const MARVEL = data as unknown as {
  game: string
  updatedAt: string
  total: number
  uniqueCards: number
  sets: MarvelSet[]
  cards: MarvelCard[]
}

export const marvelCards = MARVEL.cards
export const marvelSets = MARVEL.sets

export function getMarvelCard(id: string): MarvelCard | undefined {
  return marvelCards.find((c) => c.id === id)
}

export function getMarvelCardsBySet(setId: string): MarvelCard[] {
  return marvelCards.filter((c) => c.series === setId)
}

// Clean the 「」 brackets the source uses around the card's title epithet.
export function cleanMarvelName(name: string): string {
  return name.replace('「', '“').replace('」', '” ')
}

// Base character name — the part after the 「epithet」, e.g.
// "「Antimatter」Iron Man" -> "Iron Man". Returns '' for cards without it.
export function marvelCharacterOf(name: string): string {
  const m = name.match(/」\s*(.+)$/)
  return m ? m[1].trim() : ''
}

// Other cards featuring the same base character (excludes the given card).
export function marvelSameCharacter(card: MarvelCard, limit = 10): MarvelCard[] {
  const char = marvelCharacterOf(card.name)
  if (!char) return []
  return marvelCards
    .filter((c) => c.id !== card.id && marvelCharacterOf(c.name) === char)
    .slice(0, limit)
}

// ---- Display metadata ----

// Rarity order (low -> high) and colors for chips.
export const RARITY_ORDER = ['C', 'R', 'SR', 'GR', 'UR', 'MR', 'SEC'] as const
export const RARITY_META: Record<string, { label: string; cls: string }> = {
  C:   { label: 'Common',        cls: 'text-body border-line bg-white/5' },
  R:   { label: 'Rare',          cls: 'text-cosmic-cyan border-cosmic-cyan/40 bg-cosmic-cyan/10' },
  SR:  { label: 'Super Rare',    cls: 'text-cosmic border-cosmic/40 bg-cosmic/10' },
  UR:  { label: 'Ultra Rare',    cls: 'text-gold-bright border-gold/40 bg-gold/10' },
  MR:  { label: 'Marvel Rare',   cls: 'text-marvel-bright border-marvel/40 bg-marvel/10' },
  GR:  { label: 'Gold Rare',     cls: 'text-gold-bright border-gold/50 bg-gold/15' },
  SEC: { label: 'Secret Rare',   cls: 'text-marvel-bright border-marvel/60 bg-gradient-to-r from-marvel/15 to-cosmic/15' },
}

// Attribute (color) metadata for character cards.
export const ATTR_META: Record<string, { label: string; dot: string; cls: string }> = {
  Red:    { label: 'Red',    dot: 'bg-attr-red',    cls: 'text-attr-red border-attr-red/40 bg-attr-red/10' },
  Blue:   { label: 'Blue',   dot: 'bg-attr-blue',   cls: 'text-attr-blue border-attr-blue/40 bg-attr-blue/10' },
  Green:  { label: 'Green',  dot: 'bg-attr-green',  cls: 'text-attr-green border-attr-green/40 bg-attr-green/10' },
  Yellow: { label: 'Yellow', dot: 'bg-attr-yellow', cls: 'text-attr-yellow border-attr-yellow/40 bg-attr-yellow/10' },
}

export const ATTRIBUTES = ['Red', 'Blue', 'Green', 'Yellow'] as const

// Distinct feature tags across the set (e.g. Avengers, Human, Villain...).
export function marvelFeatureTags(): string[] {
  const set = new Set<string>()
  for (const c of marvelCards) {
    if (!c.feature) continue
    for (const f of c.feature.split('/')) set.add(f.trim())
  }
  return [...set].sort()
}

// ---- Prices ----
// Admin-set median prices live in a server-only store (see
// marvel-prices.server.ts). getMarvelPrices() is intentionally NOT here so
// this module stays safe to import from client components.

export function formatTHB(n: number | null | undefined): string {
  if (n == null) return '—'
  return '฿' + n.toLocaleString('th-TH')
}
