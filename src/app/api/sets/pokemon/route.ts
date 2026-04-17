import { NextRequest, NextResponse } from 'next/server'

const POKEMON_API_BASE = 'https://api.pokemontcg.io/v2'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '100', 10)

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      orderBy: '-releaseDate',
    })

    const res = await fetch(`${POKEMON_API_BASE}/sets?${params}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`Pokemon API error: ${res.status}`)
    }

    const data = await res.json()
    
    const sets = data.data.map((s: any) => ({
      id: s.id,
      name: s.name,
      series: s.series,
      releaseDate: s.releaseDate,
      totalCards: s.total,
      printedTotal: s.printedTotal,
      images: s.images,
      legalities: s.legalities,
    }))

    return NextResponse.json({ data: sets, totalCount: data.totalCount, page, pageSize })
  } catch (error) {
    console.error('Pokemon sets error:', error)
    return NextResponse.json({ data: [], totalCount: 0, page, pageSize, error: 'Failed to fetch sets' }, { status: 500 })
  }
}