import { NextRequest, NextResponse } from 'next/server'
import { searchPokemonJPCardsTCGdex, getJPImageUrl, buildJPFallbackImageUrl, findENImageFallback } from '@/lib/tcgdex-jp-api'
import { getJPCardImage } from '@/lib/jp-card-image-source'

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
    // 1. Supabase CDN self-hosted webp (best — fast, no proxy needed)
    // 2. TCGdex image (good — JP card art, may not always exist)
    // 3. Fallback URL from setId + localId pattern (TCGdex assets)
    // 4. EN equivalent image from Pokemon TCG API (last resort)
    const data = result.data.map(card => {
      let imageUrl: string | null = null
      let imageSource: string = 'none'
      
      // Priority 1: Supabase CDN self-hosted JP image
      // Extract setId from card.id (format: "SETID-NUMBER") since card.set is undefined in list results
      const setId = card.set?.id || card.id?.split('-')[0] || ''
      const localId = card.localId || ''
      if (setId && localId) {
        const jpImage = getJPCardImage(setId, localId)
        if (jpImage.imageUrl) {
          imageUrl = jpImage.imageUrl
          imageSource = jpImage.source // 'supabase-cdn'
        }
      }
      
      // Priority 2: TCGdex image
      if (!imageUrl && card.image) {
        imageUrl = getJPImageUrl(card.image, 'high')
        imageSource = 'tcgdex'
      }
      
      // Priority 3: TCGdex fallback URL pattern
      if (!imageUrl && setId && localId) {
        imageUrl = buildJPFallbackImageUrl(setId, localId)
        imageSource = 'tcgdex-fallback'
      }
      
      return {
        id: card.id,
        name: card.name,
        nameEN: null,
        image: imageUrl,
        imageSource,
        nameENFallback: imageSource === 'none' ? card.name : null, // only do EN fallback if no JP image at all
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

    // EN image fallback only for cards with NO JP image at all
    const cardsNeedingENFallback = data.filter(c => !c.image && c.nameENFallback)
    if (cardsNeedingENFallback.length > 0) {
      const batchSize = Math.min(cardsNeedingENFallback.length, 10)
      const fallbackPromises = cardsNeedingENFallback.slice(0, batchSize).map(async (card) => {
        const enImage = await findENImageFallback(card.nameENFallback!)
        if (enImage) {
          card.image = enImage
          card.imageSource = 'en-fallback'
        }
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