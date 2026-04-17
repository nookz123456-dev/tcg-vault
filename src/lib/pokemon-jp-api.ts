/**
 * Pokemon Card API - Japanese Edition (pokemon-card.com)
 * 
 * Scrapes the official Pokemon Card website for JP-edition cards.
 * Uses the Asia/ID site which accepts English search terms
 * but serves Japanese card artwork.
 * 
 * EN cards continue to use the existing Pokemon TCG API (pokemontcg.io).
 */

export type PokemonLang = 'en' | 'jp'

export interface PokemonJPCardData {
  id: string
  name: string          // English name (from Asia/ID site)
  nameJP: string | null // Japanese name (from JP site)
  image: string
  setName: string
  rarity: string | null
  hp: string | null
  types: string[]
  supertype: string | null
  evolution: string | null
  number: string
  skills: { name: string; cost: string; damage: string }[]
  keywords: string[]
  game: 'pokemon'
}

const BASE_URL_JP = 'https://www.pokemon-card.com'
const BASE_URL_EN_ASIA = 'https://asia.pokemon-card.com/id'

/**
 * Fetch the Japanese name for a card from the JP site.
 * Uses the same card ID as the Asia/ID site.
 */
async function fetchJPName(cardId: string): Promise<string | null> {
  try {
    const jpUrl = `https://www.pokemon-card.com/card-search/detail/${cardId}/`
    const res = await fetch(jpUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    })
    if (!res.ok) return null
    const html = await res.text()
    // Name: <h1 class="pageHeader cardDetail">ピカチュウ</h1>
    const nameMatch = html.match(/class="pageHeader cardDetail"[^>]*>([\s\S]*?)<\/h1>/)
    if (nameMatch) {
      // Remove evolve marker span from name
      const jpName = nameMatch[1].replace(/<span[^>]*>[\s\S]*?<\/span>/g, '').trim()
      return jpName || null
    }
    return null
  } catch {
    return null
  }
}

const ENERGY_MAP: Record<string, string> = {
  Grass: 'Grass',
  Fire: 'Fire',
  Water: 'Water',
  Lightning: 'Lightning',
  Psychic: 'Psychic',
  Fighting: 'Fighting',
  Darkness: 'Darkness',
  Metal: 'Metal',
  Fairy: 'Fairy',
  Colorless: 'Colorless',
  Dragon: 'Dragon',
}

const ENERGY_KEYWORDS: Record<string, string[]> = {
  Grass: ['grass', 'plant', 'leaf'],
  Fire: ['fire', 'flame', 'burn'],
  Water: ['water', 'aqua', 'ice'],
  Lightning: ['lightning', 'electric', 'thunder'],
  Psychic: ['psychic', 'mind', 'mental'],
  Fighting: ['fighting', 'fight', 'combat', 'martial'],
  Darkness: ['darkness', 'dark', 'shadow'],
  Metal: ['metal', 'steel', 'iron'],
  Fairy: ['fairy', 'fey'],
  Colorless: ['colorless', 'normal', 'color'],
  Dragon: ['dragon', 'drake'],
}

const EVOLUTION_KEYWORDS: Record<string, string[]> = {
  basic: ['basic'],
  'stage1': ['stage1', 'stage 1', 'evolved'],
  'stage2': ['stage2', 'stage 2'],
  'mega': ['mega', 'mega evolution'],
  'vmax': ['vmax'],
  'vstar': ['vstar', 'v-star'],
  'ex': ['ex'],
  'gx': ['gx'],
  'break': ['break'],
}

/**
 * Build searchable keywords from card data
 */
function buildKeywords(
  name: string,
  types: string[],
  evolution: string | null,
  rarity: string | null,
  skills: { name: string; cost: string; damage: string }[],
): string[] {
  const keywords: Set<string> = new Set()

  // Card name keywords (e.g. "Pikachu ex" → ["pikachu", "ex"])
  if (name) {
    name.toLowerCase().split(/\s+/).forEach(w => {
      if (w.length >= 2) keywords.add(w)
    })
  }

  // Energy type keywords
  types.forEach(type => {
    keywords.add(type.toLowerCase())
    const extras = ENERGY_KEYWORDS[type]
    if (extras) extras.forEach(k => keywords.add(k))
  })

  // Evolution keywords
  if (evolution) {
    const evoKey = evolution.toLowerCase().replace(/\s+/g, '')
    keywords.add(evoKey)
    const extras = EVOLUTION_KEYWORDS[evoKey]
    if (extras) extras.forEach(k => keywords.add(k))
  }

  // Rarity keywords
  if (rarity) {
    rarity.toLowerCase().split(/\s+/).forEach(w => {
      if (w.length >= 2) keywords.add(w)
    })
  }

  // Supertype keywords
  keywords.add('pokemon')
  keywords.add('card')

  // Skill-related keywords
  skills.forEach(skill => {
    if (skill.name) {
      skill.name.toLowerCase().split(/\s+/).forEach(w => {
        if (w.length >= 3) keywords.add(w)
      })
    }
  })

  return Array.from(keywords)
}

/**
 * Parse the search results page (list view with images + links)
 */
function parseSearchList(html: string): { cards: { id: string; image: string }[]; totalCount: number; totalPages: number } {
  const cards: { id: string; image: string }[] = []

  // Total count
  const countMatch = html.match(/resultNumber[^>]*>(\d+)/)
  const totalCount = countMatch ? parseInt(countMatch[1], 10) : 0

  // Total pages
  const pagesMatch = html.match(/resultTotalPages[^>]*>[^<]*\/[^<]*(\d+)/)
  const totalPages = pagesMatch ? parseInt(pagesMatch[1], 10) : 1

  // Card items: <li class="card"><a href="/path/detail/{ID}/"><img data-original="..."></a></li>
  const cardPattern = /<li class="card">\s*<a href="[^"]*detail\/(\d+)\/?">\s*<div[^>]*>\s*<img[^>]*data-original="([^"]+)"/g
  let match
  while ((match = cardPattern.exec(html)) !== null) {
    cards.push({ id: match[1], image: match[2] })
  }

  return { cards, totalCount, totalPages }
}

/**
 * Parse a card detail page for full card info
 */
function parseCardDetail(html: string, id: string, image: string): PokemonJPCardData {
  // Name: <h1 class="pageHeader cardDetail">Pikachu</h1>
  const nameMatch = html.match(/class="pageHeader cardDetail"[^>]*>([\s\S]*?)<\/h1>/)
  // Remove evolve marker span from name
  let name = ''
  if (nameMatch) {
    name = nameMatch[1].replace(/<span[^>]*>[\s\S]*?<\/span>/g, '').trim()
  }

  // HP: <span class="number">70</span>
  const hpMatch = html.match(/class="hitPoint">HP<\/span>\s*<span class="number">(\d+)<\/span>/)
  const hp = hpMatch ? hpMatch[1] : null

  // Evolution: <span class="evolveMarker">basic</span>
  const evolveMatch = html.match(/class="evolveMarker">([^<]+)/)
  const evolution = evolveMatch ? evolveMatch[1].trim() : null

  // Type images
  const typeImgs = html.match(/various_images\/energy\/(\w+)\.png/g)
  const types: string[] = []
  if (typeImgs) {
    const seen = new Set<string>()
    typeImgs.forEach(img => {
      const typeMatch = img.match(/energy\/(\w+)\.png/)
      if (typeMatch) {
        const type = ENERGY_MAP[typeMatch[1]] || typeMatch[1]
        if (!seen.has(type)) {
          seen.add(type)
          types.push(type)
        }
      }
    })
  }

  // Skills
  const skills: { name: string; cost: string; damage: string }[] = []
  const skillBlocks = html.match(/class="skill">[\s\S]*?<\/div>/g)
  if (skillBlocks) {
    for (const block of skillBlocks) {
      const skillNameMatch = block.match(/class="skillName">([^<]+)/)
      const skillDamageMatch = block.match(/class="skillDamage">([^<]*)/)
      const skillCostImgs = block.match(/various_images\/energy\/(\w+)\.png/g)
      const costTypes = skillCostImgs
        ? skillCostImgs.map(img => {
            const m = img.match(/energy\/(\w+)\.png/)
            return m ? (ENERGY_MAP[m[1]] || m[1]) : ''
          })
        : []
      
      if (skillNameMatch) {
        skills.push({
          name: skillNameMatch[1].trim(),
          cost: costTypes.join(', '),
          damage: skillDamageMatch ? skillDamageMatch[1].trim() : '',
        })
      }
    }
  }

  // Rarity - look for rarity in the info section
  const rarityMatch = html.match(/class="rarity[^"]*"[^>]*>([^<]+)/) ||
                      html.match(/class="rare[^"]*"[^>]*>([^<]+)/)
  const rarity = rarityMatch ? rarityMatch[1].trim() : null

  // Set name - from breadcrumb or set info
  const setMatch = html.match(/class="setNa[^"]*"[^>]*>([^<]+)/) ||
                   html.match(/class="series[^"]*"[^>]*>([^<]+)/)
  const setName = setMatch ? setMatch[1].trim() : ''

  return {
    id,
    name: name || `Pokemon ${id}`,
    nameJP: null, // Will be filled in by fetchJPName after parsing
    image,
    setName,
    rarity,
    hp,
    types,
    supertype: evolution ? 'Pokemon' : null,
    evolution,
    number: id,
    skills,
    keywords: buildKeywords(name, types, evolution, rarity, skills),
    game: 'pokemon',
  }
}

/**
 * Search for Japanese-edition Pokemon cards using English keywords.
 * Always uses the Asia/ID site which accepts English search terms
 * but shows Japanese card artwork.
 */
export async function searchPokemonJPCards(
  keyword: string,
  page: number = 1,
  _lang: PokemonLang = 'jp',
): Promise<{ data: PokemonJPCardData[]; totalCount: number; page: number }> {
  // Always use ID site — it accepts English keywords and shows JP card art
  const baseUrl = 'https://asia.pokemon-card.com'
  const langPath = '/id/card-search/list'
  const encodedKeyword = encodeURIComponent(keyword)

  const url = `${baseUrl}${langPath}/?keyword=${encodedKeyword}&pg=${page}`

  console.log(`[PokemonJP] Fetching: ${url}`)

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html',
    },
  })

  if (!response.ok) {
    console.error(`[PokemonJP] HTTP ${response.status}`)
    return { data: [], totalCount: 0, page }
  }

  const html = await response.text()
  const { cards: cardList, totalCount } = parseSearchList(html)

  if (cardList.length === 0) {
    return { data: [], totalCount, page }
  }

  // Fetch detail pages for each card (batch of up to 20)
  const detailedCards: PokemonJPCardData[] = []
  
  for (const card of cardList) {
    try {
      const detailPath = '/id/card-search/detail'
      const detailUrl = `https://asia.pokemon-card.com${detailPath}/${card.id}/`
      
      const detailRes = await fetch(detailUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
        },
      })
      
      if (detailRes.ok) {
        const detailHtml = await detailRes.text()
        const parsed = parseCardDetail(detailHtml, card.id, card.image)
        
        // Fetch Japanese name from JP site
        const jpName = await fetchJPName(card.id)
        parsed.nameJP = jpName
        // Add JP name to keywords for searchability
        if (jpName) {
          parsed.keywords = [...parsed.keywords, ...jpName.split(/[\s\u3000]+/).filter(w => w.length >= 2)]
        }
        
        detailedCards.push(parsed)
      } else {
        // Fallback: use basic info from list
        detailedCards.push({
          id: card.id,
          name: `Card #${card.id}`,
          nameJP: null,
          image: card.image,
          setName: '',
          rarity: null,
          hp: null,
          types: [],
          supertype: null,
          evolution: null,
          number: card.id,
          skills: [],
          keywords: [],
          game: 'pokemon',
        })
      }
    } catch (err) {
      console.error(`[PokemonJP] Detail fetch error for ${card.id}:`, err)
      detailedCards.push({
        id: card.id,
        name: `Card #${card.id}`,
        nameJP: null,
        image: card.image,
        setName: '',
        rarity: null,
        hp: null,
        types: [],
        supertype: null,
        evolution: null,
        number: card.id,
        skills: [],
        keywords: [],
        game: 'pokemon',
      })
    }
  }

  console.log(`[PokemonJP] Returning ${detailedCards.length} cards (total: ${totalCount})`)
  return { data: detailedCards, totalCount, page }
}