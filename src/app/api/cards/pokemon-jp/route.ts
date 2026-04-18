import { NextRequest, NextResponse } from 'next/server'
import { searchPokemonJPCardsTCGdex, getJPImageUrl, buildJPFallbackImageUrl, findENImageFallback } from '@/lib/tcgdex-jp-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const keyword = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  if (!keyword.trim()) {
    return NextResponse.json({ data: [], totalCount: 0, page: 1 })
  }

  try {
    const result = await searchPokemonJPCardsTCGdex(keyword, page)
    
    // Transform for display with image fallback chain:
    // 1. TCGdex image (best — JP art)
    // 2. Fallback URL from setId + localId pattern
    // 3. EN equivalent image from Pokemon TCG API (same art, different language)
    const data = result.data.map(card => {
      let imageUrl: string | null = null
      if (card.image) {
        imageUrl = getJPImageUrl(card.image, 'high')
      } else if (card.set?.id && card.localId) {
        imageUrl = buildJPFallbackImageUrl(card.set.id, card.localId)
      }
      // Note: EN fallback is async, handled below
      return {
        id: card.id,
        name: card.name,
        nameEN: null,
        image: imageUrl,
        nameENFallback: card.name, // store for EN lookup
        setName: card.set?.name || '',
        rarity: card.rarity || null,
        hp: card.hp?.toString() || null,
        types: card.types?.map(t => t) || [],
        supertype: card.category || 'Pokemon',
        evolution: card.stage || null,
        number: card.localId || '',
        skills: card.attacks?.map(a => ({
          name: a.name,
          cost: a.cost?.join(', ') || '',
          damage: a.damage || '',
        })) || [],
        keywords: buildKeywords(card),
        game: 'pokemon',
      }
    })

    // EN image fallback for cards without JP image (async batch)
    const cardsNeedingENFallback = data.filter(c => !c.image && c.nameENFallback)
    if (cardsNeedingENFallback.length > 0) {
      // Limit to 5 concurrent lookups to avoid rate limiting
      const batchSize = Math.min(cardsNeedingENFallback.length, 10)
      const fallbackPromises = cardsNeedingENFallback.slice(0, batchSize).map(async (card) => {
        const enImage = await findENImageFallback(card.nameENFallback!)
        if (enImage) card.image = enImage
      })
      await Promise.all(fallbackPromises)
    }

    // Remove temp field
    data.forEach(c => { delete (c as any).nameENFallback })

    return NextResponse.json({ data, totalCount: result.totalCount, page: result.page })
  } catch (error) {
    console.error('Pokemon JP search error:', error)
    return NextResponse.json(
      { data: [], totalCount: 0, page, error: 'Failed to fetch cards' },
      { status: 500 }
    )
  }
}

function buildKeywords(card: any): string[] {
  const keywords = new Set<string>()
  
  if (card.name) {
    card.name.split(/[\s\u3000]+/).forEach((w: string) => {
      if (w.length >= 2) keywords.add(w)
    })
  }
  
  if (card.types) {
    card.types.forEach((t: string) => keywords.add(t.toLowerCase()))
  }
  
  if (card.rarity) {
    card.rarity.toLowerCase().split(/\s+/).forEach((w: string) => {
      if (w.length >= 2) keywords.add(w)
    })
  }
  
  if (card.stage) {
    keywords.add(card.stage.toLowerCase())
  }
  
  if (card.attacks) {
    card.attacks.forEach((a: any) => {
      if (a.name) {
        a.name.split(/[\s\u3000]+/).forEach((w: string) => {
          if (w.length >= 2) keywords.add(w)
        })
      }
    })
  }
  
  keywords.add('pokemon')
  keywords.add('card')
  keywords.add('jp')
  
  return Array.from(keywords)
}