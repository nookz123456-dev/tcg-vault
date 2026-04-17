import { NextRequest, NextResponse } from 'next/server'

const POKEMON_API_BASE = 'https://api.pokemontcg.io/v2'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const { setId } = await params
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)

  try {
    // Fetch all cards in this set
    const q = `set.id:${setId}`
    const params2 = new URLSearchParams({
      q,
      page: page.toString(),
      pageSize: pageSize.toString(),
      orderBy: 'number',
    })

    const res = await fetch(`${POKEMON_API_BASE}/cards?${params2}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`Pokemon API error: ${res.status}`)
    }

    const data = await res.json()

    const cards = data.data.map((c: any) => ({
      id: c.id,
      name: c.name,
      number: c.number,
      rarity: c.rarity,
      supertype: c.supertype,
      subtypes: c.subtypes,
      hp: c.hp,
      types: c.types,
      image: c.images?.small || null,
      imageLarge: c.images?.large || null,
      tcgplayer: c.tcgplayer ? {
        url: c.tcgplayer.url,
        prices: c.tcgplayer.prices,
      } : null,
    }))

    // Also fetch set info
    const setRes = await fetch(`${POKEMON_API_BASE}/sets/${setId}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    const setData = setRes.ok ? await setRes.json() : null

    return NextResponse.json({
      set: setData?.data ? {
        id: setData.data.id,
        name: setData.data.name,
        series: setData.data.series,
        releaseDate: setData.data.releaseDate,
        totalCards: setData.data.total,
        printedTotal: setData.data.printedTotal,
        images: setData.data.images,
        legalities: setData.data.legalities,
      } : null,
      data: cards,
      totalCount: data.totalCount,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Pokemon set cards error:', error)
    return NextResponse.json({ data: [], totalCount: 0, page, pageSize, error: 'Failed to fetch set cards' }, { status: 500 })
  }
}