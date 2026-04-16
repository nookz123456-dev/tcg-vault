import { NextResponse } from 'next/server'
import { searchOnePieceCards, OnePieceLang } from '@/lib/onepiece-api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const lang = (searchParams.get('lang') || 'en') as OnePieceLang
  const cardType = searchParams.get('type') || 'all'
  const rarity = searchParams.get('rarity') || 'all'

  if (!query.trim()) {
    return NextResponse.json({ data: [], totalCount: 0, page, pageSize })
  }

  try {
    const results = await searchOnePieceCards(query, page, pageSize, lang, cardType, rarity)
    return NextResponse.json(results)
  } catch (error) {
    console.error('One Piece API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch One Piece cards' },
      { status: 500 }
    )
  }
}