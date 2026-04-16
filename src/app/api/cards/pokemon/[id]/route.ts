import { NextResponse } from 'next/server'
import { getPokemonCard, getCardPrice } from '@/lib/api'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const card = await getPokemonCard(id)
    const prices = getCardPrice(card)
    return NextResponse.json({ data: card, prices })
  } catch (error) {
    console.error('Pokemon API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch card' },
      { status: 500 }
    )
  }
}