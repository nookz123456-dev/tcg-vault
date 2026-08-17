import { NextResponse } from 'next/server'
import { getMergedCards } from '@/lib/marvel-variants.server'

// Public: the full card list including admin-added rarity variants.
// Used by client components (e.g. the admin pricing grid) that can't import the
// server-only merge directly.
export async function GET() {
  const cards = await getMergedCards()
  return NextResponse.json({ cards })
}
