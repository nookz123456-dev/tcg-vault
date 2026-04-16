// One Piece Card Game API - Scraping from official Bandai site
// Supports both English (asia-en) and Japanese (www) sites
// Supports card type filtering (LEADER, CHARACTER, EVENT, STAGE)

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

// One Piece rarity levels (from category field)
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

export async function searchOnePieceCards(
  query: string,
  page: number = 1,
  pageSize: number = 20,
  lang: OnePieceLang = 'en',
  cardType: string = 'all',
  rarity: string = 'all'
): Promise<OnePieceSearchResult> {
  const baseUrl = OP_LANG_SITES[lang]
  // Bandai site doesn't support server-side type filtering
  // We fetch all and filter client-side after parsing
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

  // Extract total count
  const totalMatch = html.match(/(\d+)\s*results/)
  const totalCount = totalMatch ? parseInt(totalMatch[1]) : 0

  // Split by modalCol blocks
  const modalBlocks = html.split('class="modalCol"')

  for (let i = 1; i < modalBlocks.length; i++) {
    const block = modalBlocks[i]
    if (!block.includes('cardName')) continue

    // Extract ID from the id attribute
    const idMatch = block.match(/^[\s\S]*?id="([^"]+)"/)
    const cardId = idMatch ? idMatch[1] : ''

    // Skip alternate art cards
    if (cardId.includes('_p')) continue

    // Extract infoCol: "OP15-001 | L | LEADER"
    const infoMatch = block.match(/class="infoCol"[\s\S]*?<span>([^<]+)<\/span>\s*\|\s*<span>([^<]+)<\/span>\s*\|\s*<span>([^<]+)<\/span>/)
    const code = infoMatch ? infoMatch[1].trim() : cardId
    const category = infoMatch ? infoMatch[2].trim() : ''
    const type = infoMatch ? infoMatch[3].trim() : ''

    // Extract name
    const nameMatch = block.match(/class="cardName"[^>]*>([\s\S]*?)<\/div>/)
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown'

    // Construct image URL
    const image = cardId ? `${baseUrl}/images/cardlist/card/${cardId}.png` : ''

    // Extract cost/life
    const costMatch = block.match(/class="cost"[^>]*>[\s\S]*?<\/h3>([\s\S]*?)<\/div>/)
    const costRaw = costMatch ? costMatch[1].replace(/<[^>]+>/g, '').trim() : ''
    const cost = costRaw.replace(/[^0-9\-]/g, '')

    // Extract attribute
    const attrMatch = block.match(/class="attribute"[\s\S]*?<i>([^<]+)<\/i>/)
    const attribute = attrMatch ? attrMatch[1].trim() : null

    // Extract power
    const powerMatch = block.match(/class="power"[^>]*>[\s\S]*?<\/h3>([\s\S]*?)<\/div>/)
    const powerRaw = powerMatch ? powerMatch[1].replace(/<[^>]+>/g, '').trim() : null
    const power = powerRaw && powerRaw !== '-' ? powerRaw.replace(/[^0-9]/g, '') : null

    // Extract counter
    const counterMatch = block.match(/class="counter"[^>]*>[\s\S]*?<\/h3>([\s\S]*?)<\/div>/)
    const counterRaw = counterMatch ? counterMatch[1].replace(/<[^>]+>/g, '').trim() : null
    const counter = counterRaw && counterRaw !== '-' ? counterRaw : null

    // Extract color
    const colorMatch = block.match(/class="color"[^>]*>[\s\S]*?<\/h3>([\s\S]*?)<\/div>/)
    const color = colorMatch ? colorMatch[1].replace(/<[^>]+>/g, '').trim() : ''

    // Extract feature/type (family)
    const featureMatch = block.match(/class="feature"[^>]*>[\s\S]*?<\/h3>([\s\S]*?)<\/div>/)
    const family = featureMatch ? featureMatch[1].replace(/<[^>]+>/g, '').trim() : null

    // Extract effect/ability
    const textMatch = block.match(/class="text"[^>]*>[\s\S]*?<\/h3>([\s\S]*?)<\/div>/)
    const ability = textMatch ? textMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : ''

    // Extract trigger
    const triggerMatch = block.match(/class="trigger"[^>]*>[\s\S]*?<\/h3>([\s\S]*?)<\/div>/)
    const trigger = triggerMatch ? triggerMatch[1].replace(/<[^>]+>/g, '').trim() : null

    // Extract rarity from card HTML
    const rarityMatch = block.match(/class="rarity"[^>]*>([\s\S]*?)<\/div>/)
    const cardRarity = rarityMatch ? rarityMatch[1].replace(/<[^>]+>/g, '').trim() : ''

    // Client-side type filter (Bandai site doesn't support server-side type filtering)
    if (cardType !== 'all' && type !== cardType.toUpperCase()) continue

    // Client-side rarity filter (compare category field since that's the rarity code: C, UC, R, SR, SEC, ALT, SP, P)
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

  // Apply pagination (totalCount reflects filtered results)
  const filteredTotal = cards.length
  const start = (page - 1) * pageSize
  const pagedCards = cards.slice(start, start + pageSize)

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
    image: '',
    category: '',
  }
}