import { NextRequest, NextResponse } from 'next/server'
import { searchPokemonJPCards } from '@/lib/pokemon-jp-api'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const keyword = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const lang = (searchParams.get('lang') || 'jp') as 'en' | 'jp'

  if (!keyword.trim()) {
    return NextResponse.json({ data: [], totalCount: 0, page: 1 })
  }

  try {
    const result = await searchPokemonJPCards(keyword, page, lang)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Pokemon JP search error:', error)
    return NextResponse.json(
      { data: [], totalCount: 0, page, error: 'Failed to fetch cards' },
      { status: 500 }
    )
  }
}