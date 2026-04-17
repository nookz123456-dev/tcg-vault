import { NextRequest, NextResponse } from 'next/server'
import { searchPokemonJPCardsTCGdex, getJPImageUrl } from '@/lib/tcgdex-jp-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const keyword = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  if (!keyword.trim()) {
    return NextResponse.json({ data: [], totalCount: 0, page: 1 })
  }

  try {
    const result = await searchPokemonJPCardsTCGdex(keyword, page)
    
    // Transform for display
    const data = result.data.map(card => ({
      id: card.id,
      name: card.name, // Japanese name
      nameEN: null,
      image: card.image ? getJPImageUrl(card.image, 'high') : null,
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
    }))

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