import { NextResponse } from 'next/server'
import { searchPokemonCards } from '@/lib/api'

// Pokemon rarity levels (standard TCG)
export const POKEMON_RARITIES: Record<string, string> = {
  all: 'All Rarities',
  Common: 'Common',
  Uncommon: 'Uncommon',
  Rare: 'Rare',
  'Rare Holo': 'Rare Holo',
  'Rare Ultra': 'Rare Ultra',
  'Rare Secret': 'Rare Secret',
  'Rare Rainbow': 'Rainbow Rare',
  'Rare Alt': 'Alt Art Rare',
  'Rare Shiny': 'Shiny Rare',
  'Amazing Rare': 'Amazing Rare',
  'Promo': 'Promo',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const supertype = searchParams.get('supertype') || 'all'
  const subtype = searchParams.get('subtype') || 'all'
  const series = searchParams.get('series') || 'all'
  const rarity = searchParams.get('rarity') || 'all'

  if (!query.trim()) {
    return NextResponse.json({ data: [], page, pageSize: 0, count: 0, totalCount: 0 })
  }

  try {
    let searchQuery = `name:"${query}"`
    
    if (supertype !== 'all') {
      searchQuery += ` supertype:"${supertype}"`
    }
    if (subtype !== 'all') {
      searchQuery += ` subtypes:"${subtype}"`
    }
    if (series !== 'all') {
      const seriesNames: Record<string, string> = {
        'scarlet-violet': 'Scarlet & Violet',
        'sword-shield': 'Sword & Shield',
        'sun-moon': 'Sun & Moon',
        'xy': 'XY',
        'black-white': 'Black & White',
      }
      const seriesName = seriesNames[series] || series
      searchQuery += ` set.series:"${seriesName}"`
    }
    if (rarity !== 'all') {
      searchQuery += ` rarity:"${rarity}"`
    }

    const results = await searchPokemonCards(searchQuery, page, pageSize)
    return NextResponse.json(results)
  } catch (error) {
    console.error('Pokemon API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    )
  }
}