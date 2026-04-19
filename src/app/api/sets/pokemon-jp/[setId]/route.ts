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
        'User-Agent': 'HoloCheck/1.0',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!setRes.ok) {
      throw new Error(`TCGdex JP set error: ${setRes.status}`)
    }

    const setData = await setRes.json()

    // Extract cards from set data with JP image priority:
    // 1. Supabase CDN self-hosted webp (fast, no proxy)
    // 2. TCGdex image (only if card has actual image URL)
    const cards = (setData.cards || []).map((c: any) => {
      let image: string | null = null
      let imageSource: string = 'none'
      
      // Priority 1: Supabase CDN self-hosted JP image
      const jpImg = getJPCardImage(setId, c.localId)
      if (jpImg.imageUrl) {
        image = jpImg.imageUrl
        imageSource = jpImg.source
      }
      
      // Priority 2: TCGdex image (only actual URLs, no fabricated patterns)
      if (!image && c.image) {
        image = `${c.image}/high.webp`
        imageSource = 'tcgdex'
      }
      
      return {
        id: c.id,
        localId: c.localId,
        name: c.name,
        image,
        imageSource,
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