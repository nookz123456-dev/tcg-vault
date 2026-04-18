import { NextRequest, NextResponse } from 'next/server'
import { buildJPFallbackImageUrl } from '@/lib/tcgdex-jp-api'
import { getJPCardImage } from '@/lib/jp-card-image-source'

const TCGDEX_JP = 'https://api.tcgdex.net/v2/ja'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const { setId } = await params

  try {
    // Fetch set info + cards
    const setRes = await fetch(`${TCGDEX_JP}/sets/${setId}`, {
      headers: {
        'User-Agent': 'TCGVault/1.0',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!setRes.ok) {
      throw new Error(`TCGdex JP set error: ${setRes.status}`)
    }

    const setData = await setRes.json()

    // Extract cards from set data with JP image priority:
    // 1. pokemon-card.com authentic JP image (proxied)
    // 2. TCGdex image
    // 3. TCGdex fallback URL pattern
    const cards = (setData.cards || []).map((c: any) => {
      let image: string | null = null
      
      // Priority 1: pokemon-card.com JP image
      const jpImg = getJPCardImage(setId, c.localId)
      if (jpImg.proxiedUrl) {
        image = jpImg.proxiedUrl
      }
      
      // Priority 2: TCGdex image
      if (!image && c.image) {
        image = `${c.image}/high.webp`
      }
      
      // Priority 3: TCGdex fallback
      if (!image && c.id) {
        image = buildJPFallbackImageUrl(setId, c.localId)
      }
      
      return {
        id: c.id,
        localId: c.localId,
        name: c.name,
        image,
        category: c.category || null,
        hp: c.hp || null,
        types: c.types || [],
        rarity: c.rarity || null,
        stage: c.stage || null,
      }
    })

    const setInfo = {
      id: setData.id,
      name: setData.name,
      cardCount: setData.cardCount?.total || setData.cardCount?.official || 0,
      releaseDate: setData.releaseDate || null,
      logo: setData.logo || null,
      symbol: setData.symbol || null,
    }

    return NextResponse.json({
      set: setInfo,
      data: cards,
      totalCount: cards.length,
    })
  } catch (error) {
    console.error('Pokemon JP set cards error:', error)
    return NextResponse.json({ data: [], totalCount: 0, error: 'Failed to fetch JP set cards' }, { status: 500 })
  }
}