import { NextRequest, NextResponse } from 'next/server'
import { searchPokemonJPCardsTCGdex, getJPImageUrl } from '@/lib/tcgdex-jp-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const keyword = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const debug = searchParams.get('debug') === '1'

  console.log(`[Pokemon JP API] Search request: q="${keyword}", page=${page}`)

  if (!keyword.trim()) {
    return NextResponse.json({ data: [], totalCount: 0, page: 1 })
  }

  // Debug mode: test direct TCGdex API call
  if (debug) {
    try {
      const testUrl = `https://api.tcgdex.net/v2/ja/cards?name=${encodeURIComponent(keyword)}`
      console.log(`[Pokemon JP API] Debug: fetching ${testUrl}`)
      const testRes = await fetch(testUrl, {
        headers: { 'User-Agent': 'TCGVault/1.0', 'Accept': 'application/json' },
        cache: 'no-store'
      })
      const testData = await testRes.json()
      
      // Test searchTCGdexJP directly
      const { searchTCGdexJP } = await import('@/lib/tcgdex-jp-api')
      let directSearchResult: any = null
      let directSearchError: string | null = null
      try {
        directSearchResult = await searchTCGdexJP(keyword)
        console.log(`[Pokemon JP API] Debug: searchTCGdexJP returned ${directSearchResult?.length ?? 'null'} results`)
      } catch (e: any) {
        directSearchError = String(e)
        console.error(`[Pokemon JP API] Debug: searchTCGdexJP error:`, e)
      }
      
      return NextResponse.json({
        debug: true,
        keyword,
        keywordBytes: Buffer.from(keyword).toString('hex'),
        isJapanese: isJapaneseCheck(keyword),
        directApi: {
          status: testRes.status,
          resultCount: Array.isArray(testData) ? testData.length : 'NOT_ARRAY',
          sample: Array.isArray(testData) && testData.length > 0 ? { id: testData[0].id, name: testData[0].name } : null,
        },
        directSearch: {
          resultCount: directSearchResult?.length ?? null,
          error: directSearchError,
          sampleId: Array.isArray(directSearchResult) && directSearchResult.length > 0 ? directSearchResult[0].id : null,
        },
      })
    } catch (err: any) {
      return NextResponse.json({ debug: true, error: String(err), message: err?.message, keyword })
    }
  }
  
  // Helper for debug
  function isJapaneseCheck(text: string): boolean {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text)
  }

  try {
    const result = await searchPokemonJPCardsTCGdex(keyword, page)
    console.log(`[Pokemon JP API] Search result: ${result.data.length} cards found for "${keyword}"`)
    
    // Debug: if empty, return debug info
    if (result.data.length === 0) {
      return NextResponse.json({ 
        data: [], 
        totalCount: 0, 
        page: result.page,
        debug: {
          keyword,
          isJapanese: /[぀-ゟ゠-ヿ一-鿿]/.test(keyword),
          timestamp: new Date().toISOString()
        }
      })
    }
    
    // Transform for display
    const data = result.data.map(card => ({
      id: card.id,
      name: card.name, // Japanese name
      nameEN: null, // Could fetch from EN API if needed
      image: card.image ? getJPImageUrl(card.image, 'high') : null,
      setName: card.set?.name || '',
      rarity: card.rarity || null,
      hp: card.hp?.toString() || null,
      types: card.types?.map(t => t) || [],
      supertype: card.category === 'Pokemon' ? 'Pokemon' : card.category,
      evolution: card.stage || null,
      number: card.localId || '',
      skills: card.attacks?.map(a => ({
        name: a.name, // Japanese attack name
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
      { data: [], totalCount: 0, page, error: 'Failed to fetch cards', detail: String(error) },
      { status: 500 }
    )
  }
}

function buildKeywords(card: any): string[] {
  const keywords = new Set<string>()
  
  // Japanese name keywords
  if (card.name) {
    card.name.split(/[\s\u3000]+/).forEach((w: string) => {
      if (w.length >= 2) keywords.add(w)
    })
  }
  
  // Type keywords
  if (card.types) {
    card.types.forEach((t: string) => keywords.add(t.toLowerCase()))
  }
  
  // Rarity keywords
  if (card.rarity) {
    card.rarity.toLowerCase().split(/\s+/).forEach((w: string) => {
      if (w.length >= 2) keywords.add(w)
    })
  }
  
  // Stage keywords
  if (card.stage) {
    keywords.add(card.stage.toLowerCase())
  }
  
  // Attack name keywords
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