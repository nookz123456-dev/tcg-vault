// One Piece Card Game API
// Primary data: OPTCG API (optcgapi.com) — images + prices, no hotlink block
// Fallback: Bandai scraping (asia-en / www) — search + metadata
// Supports both English (asia-en) and Japanese (www) sites

export interface OnePieceCardData {
  id: string
  code: string
  name: string
  rarity: string
  type: string       // LEADER, CHARACTER, EVENT, STAGE
  color: string
  cost: string       // Life for Leaders, Cost for others
  power: string | null
  counter: string | null
  attribute: string | null
  family: string | null
  ability: string
  trigger: string | null
  setName: string
  image: string
  category: string   // L (Leader), C (Character), E (Event), S (Stage)
  market_price?: number | null
  inventory_price?: number | null
}

export interface OnePieceSearchResult {
  data: OnePieceCardData[]
  totalCount: number
  page: number
  pageSize: number
}

export type OnePieceLang = 'en' | 'jp'

export const OP_LANG_SITES: Record<OnePieceLang, string> = {
  en: 'https://asia-en.onepiece-cardgame.com',
  jp: 'https://www.onepiece-cardgame.com',
}

export const OP_CARD_TYPES: Record<string, string> = {
  all: 'All Types',
  LEADER: 'Leader',
  CHARACTER: 'Character',
  EVENT: 'Event',
  STAGE: 'Stage',
}

export const OP_TYPE_PARAMS: Record<string, string> = {
  all: '',
  LEADER: '',
  CHARACTER: '',
  EVENT: '',
  STAGE: '',
}

// One Piece rarity levels
export const OP_RARITIES: Record<string, string> = {
  all: 'All Rarities',
  C: 'Common',
  UC: 'Uncommon',
  R: 'Rare',
  SR: 'Super Rare',
  SEC: 'Secret Rare',
  ALT: 'Alt Art',
  SP: 'Special',
  P: 'Promo',
}

// OPTCG API: Get card image URL by card ID (e.g., "OP01-001")
// Images are hosted on optcgapi.com — no hotlink block!
export function getOPTCGImageUrl(cardId: string): string {
  return `https://optcgapi.com/media/static/Card_Images/${cardId}.jpg`
}

// OPTCG API: Fetch card data by card ID (includes image + prices)
export async function fetchOPTCGCard(cardId: string): Promise<any | null> {
  try {
    const res = await fetch(`https://optcgapi.com/api/sets/card/${cardId}/`, {
      headers: { 'User-Agent': 'TCGVault/1.0' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) return data[0]
    return null
  } catch {
    return null
  }
}

// OPTCG API: Fetch all cards in a set
export async function fetchOPTCGSetCards(setId: string): Promise<any[]> {
  try {
    const res = await fetch(`https://optcgapi.com/api/sets/${setId}/`, {
      headers: { 'User-Agent': 'TCGVault/1.0' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    if (Array.isArray(data)) return data
    return []
  } catch {
    return []
  }
}

// Try to find card in OPTCG API by card_set_id
export async function findOPTCGCard(cardId: string): Promise<any | null> {
  // Try direct lookup first
  const direct = await fetchOPTCGCard(cardId)
  if (direct) return direct

  // Try extracting set ID from card ID (e.g., "OP01-001" → "OP-01")
  const match = cardId.match(/^([A-Z]+)(\d+)-(\d+)$/i)
  if (match) {
    const setId = `${match[1]}-${match[2]}`
    const setCards = await fetchOPTCGSetCards(setId)
    const found = setCards.find(c => c.card_set_id === cardId)
    if (found) return found
  }

  return null
}

export async function searchOnePieceCards(
  query: string,
  page: number = 1,
  pageSize: number = 20,
  lang: OnePieceLang = 'en',
  cardType: string = 'all',
  rarity: string = 'all'
): Promise<OnePieceSearchResult> {
  const baseUrl = OP_LANG_SITES[lang]
  const url = `${baseUrl}/cardlist/?search=${encodeURIComponent(query)}`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`One Piece API error: ${res.status} ${res.statusText}`)
  }

  const html = await res.text()
  const cards: OnePieceCardData[] = []

  const totalMatch = html.match(/(\d+)\s*results/)
  const totalCount = totalMatch ? parseInt(totalMatch[1]) : 0

  const modalBlocks = html.split('class="modalCol"')

  for (let i = 1; i < modalBlocks.length; i++) {
    const block = modalBlocks[i]
    if (!block.includes('cardName')) continue

    const idMatch = block.match(/^[\s\S]*?id="([^"]+)"/)
    const cardId = idMatch ? idMatch[1] : ''
    if (cardId.includes('_p')) continue

    const infoMatch = block.match(/class="infoCol"[\s\S]*?<span>([^<]+)<\/span>\s*\|\s*<span>([^<]+)<\/span>\s*\|\s*<span>([^<]+)<\/span>/)
    const code = infoMatch ? infoMatch[1].trim() : cardId
    const category = infoMatch ? infoMatch[2].trim() : ''
    const type = infoMatch ? infoMatch[3].trim() : ''

    const nameMatch = block.match(/class="cardName"[^>]*>([\s\S]*?)<\/div>/)
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown'

    // Use OPTCG API image URL (no hotlink block!) instead of Bandai
    const image = cardId ? getOPTCGImageUrl(cardId) : ''

    const costMatch = block.match(/class="cost"[^>]*>[\s\S]*?<\/h3>([\s\S]*?)<\/div>/)
    const costRaw = costMatch ? costMatch[1].replace(/<[^>]+>/g, '').trim() : ''
    const cost = costRaw.replace(/[^0-9\-]/g, '')

    const attrMatch = block.match(/class="attribute"[\s\S]*?<i>([^<]+)<\/i>/)
    const attribute = attrMatch ? attrMatch[1].trim() : null

    const powerMatch = block.match(/class="power"[^>]*>[\s\S]*?<\/h3>([\s\S]*?)<\/div>/)
    const powerRaw = powerMatch ? powerMatch[1].replace(/<[^>]+>/g, '').trim() : null
    const power = powerRaw && powerRaw !== '-' ? powerRaw.replace(/[^0-9]/g, '') : null

    const counterMatch = block.match(/class="counter"[^>]*>[\s\S]*?<\/h3>([\s\S]*?)<\/div>/)
    const counterRaw = counterMatch ? counterMatch[1].replace(/<[^>]+>/g, '').trim() : null
    const counter = counterRaw && counterRaw !== '-' ? counterRaw : null

    const colorMatch = block.match(/class="color"[^>]*>[\s\S]*?<\/h3>([\s\S]*?)<\/div>/)
    const color = colorMatch ? colorMatch[1].replace(/<[^>]+>/g, '').trim() : ''

    const featureMatch = block.match(/class="feature"[^>]*>[\s\S]*?<\/h3>([\s\S]*?)<\/div>/)
    const family = featureMatch ? featureMatch[1].replace(/<[^>]+>/g, '').trim() : null

    const textMatch = block.match(/class="text"[^>]*>[\s\S]*?<\/h3>([\s\S]*?)<\/div>/)
    const ability = textMatch ? textMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : ''

    const triggerMatch = block.match(/class="trigger"[^>]*>[\s\S]*?<\/h3>([\s\S]*?)<\/div>/)
    const trigger = triggerMatch ? triggerMatch[1].replace(/<[^>]+>/g, '').trim() : null

    const rarityMatch = block.match(/class="rarity"[^>]*>([\s\S]*?)<\/div>/)
    const cardRarity = rarityMatch ? rarityMatch[1].replace(/<[^>]+>/g, '').trim() : ''

    if (cardType !== 'all' && type !== cardType.toUpperCase()) continue
    if (rarity !== 'all' && category !== rarity) continue

    cards.push({
      id: cardId || code,
      code,
      name,
      rarity: cardRarity,
      type,
      color,
      cost,
      power,
      counter,
      attribute,
      family,
      ability,
      trigger,
      setName: '',
      image,
      category,
    })
  }

  const filteredTotal = cards.length
  const start = (page - 1) * pageSize
  const pagedCards = cards.slice(start, start + pageSize)

  // Enrich with OPTCG prices (batch by set to minimize API calls)
  if (pagedCards.length > 0) {
    // Group cards by set prefix (e.g., "OP01", "OP05", "ST01")
    const setGroups = new Map<string, OnePieceCardData[]>()
    for (const card of pagedCards) {
      const setId = (card.id || card.code).match(/^([A-Z]+-?\d+)/i)?.[1]
      if (setId) {
        if (!setGroups.has(setId)) setGroups.set(setId, [])
        setGroups.get(setId)!.push(card)
      }
    }

    const setPromises = [...setGroups.entries()].map(async ([setId, cards]) => {
      // Convert card ID to OPTCG set ID: "OP01" → "OP-01", "ST01" → "ST-01"
      const optcgSetId = setId.replace(/^([A-Z]+)(\d+)$/i, '$1-$2')
      const setCards = await fetchOPTCGSetCards(optcgSetId)
      for (const card of cards) {
        const match = setCards.find(c => c.card_set_id === (card.id || card.code))
        if (match) {
          card.market_price = match.market_price || null
          card.inventory_price = match.inventory_price || null
          if (match.set_name && !card.setName) card.setName = match.set_name
        }
      }
    })
    await Promise.all(setPromises)
  }

  return {
    data: pagedCards,
    totalCount: (cardType === 'all' && rarity === 'all') ? totalCount : filteredTotal,
    page,
    pageSize,
  }
}

export async function getOnePieceCard(id: string, lang: OnePieceLang = 'en'): Promise<OnePieceCardData> {
  const results = await searchOnePieceCards(id, 1, 1, lang)
  if (results.data.length > 0) {
    return results.data[0]
  }
  
  return {
    id,
    code: id,
    name: 'Unknown',
    rarity: '',
    type: '',
    color: '',
    cost: '',
    power: null,
    counter: null,
    attribute: null,
    family: null,
    ability: '',
    trigger: null,
    setName: '',
    image: getOPTCGImageUrl(id),
    category: '',
  }
}