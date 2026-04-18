import { NextRequest, NextResponse } from 'next/server'

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

    // Extract cards from set data
    const cards = (setData.cards || []).map((c: any) => ({
      id: c.id,
      localId: c.localId,
      name: c.name,
      image: c.image ? `${c.image}/high.webp` : (c.id ? (() => { const sid = setId; const prefix = sid.match(/^(SV|SM|S|E|ADV|neo|web|VS|PMCG|swsh)/i)?.[1] || sid.replace(/[0-9]+.*$/, ''); return `https://assets.tcgdex.net/ja/${prefix}/${sid}/${c.localId}/high.webp`; })() : null),
      category: c.category || null,
      hp: c.hp || null,
      types: c.types || [],
      rarity: c.rarity || null,
      stage: c.stage || null,
    }))

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