import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getHeaders(token?: string) {
  const h: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

// GET /api/marketplace — browse listings with filters
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const game = searchParams.get('game')
  const cardId = searchParams.get('card_id')
  const sellerId = searchParams.get('seller_id')
  const minPrice = searchParams.get('min_price')
  const maxPrice = searchParams.get('max_price')
  const condition = searchParams.get('condition')
  const sort = searchParams.get('sort') || 'newest'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 50)
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  let query = `is_active=eq.true`
  if (game) query += `&game=eq.${game}`
  if (cardId) query += `&card_id=eq.${encodeURIComponent(cardId)}`
  if (sellerId) query += `&seller_id=eq.${sellerId}`
  if (condition) query += `&condition=eq.${condition}`
  if (minPrice) query += `&price=gte.${minPrice}`
  if (maxPrice) query += `&price=lte.${maxPrice}`

  // Sort
  const orderMap: Record<string, string> = {
    newest: 'created_at.desc',
    oldest: 'created_at.asc',
    price_low: 'price.asc',
    price_high: 'price.desc',
  }
  const orderBy = orderMap[sort] || orderMap.newest
  const [col, dir] = orderBy.split('.')
  query += `&order=${col}.${dir}&limit=${limit}&offset=${(page - 1) * limit}`

  // Join seller profile
  query += `&select=*,seller:profiles!marketplace_listings_seller_id_fkey(id,username,display_name,seller_status)`

  const res = await fetch(`${SUPABASE_URL}/rest/v1/marketplace_listings?${query}`, {
    headers: getHeaders(token),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: res.status })
  }

  const listings = await res.json()

  // Get total count
  let countQuery = `is_active=eq.true`
  if (game) countQuery += `&game=eq.${game}`
  if (cardId) countQuery += `&card_id=eq.${encodeURIComponent(cardId)}`
  if (sellerId) countQuery += `&seller_id=eq.${sellerId}`
  if (condition) countQuery += `&condition=eq.${condition}`
  if (minPrice) countQuery += `&price=gte.${minPrice}`
  if (maxPrice) countQuery += `&price=lte.${maxPrice}`
  countQuery += `&select=id`

  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/marketplace_listings?${countQuery}`, {
    headers: { ...getHeaders(token), 'Prefer': 'count=exact', 'Range': '0-0' },
  })
  const total = parseInt(countRes.headers.get('content-range')?.split('/')[1] || '0')

  return NextResponse.json({ listings, total, page, limit })
}

// POST /api/marketplace — create listing (verified sellers only)
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { game, card_id, card_name, card_image, condition, graded_company, graded_grade, price, currency, quantity, description } = body

  if (!game || !card_id || !card_name || !condition || !price) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify seller status
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${body.seller_id}&select=seller_status`, {
    headers: getHeaders(token),
  })
  const profiles = await profileRes.json()
  if (!profiles.length || profiles[0].seller_status !== 'verified') {
    return NextResponse.json({ error: 'Only verified sellers can list items' }, { status: 403 })
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/marketplace_listings`, {
    method: 'POST',
    headers: { ...getHeaders(token), 'Prefer': 'return=representation' },
    body: JSON.stringify({
      seller_id: body.seller_id,
      game,
      card_id,
      card_name,
      card_image,
      condition,
      graded_company: graded_company || null,
      graded_grade: graded_grade || null,
      price: parseFloat(price),
      currency: currency || 'USD',
      quantity: quantity || 1,
      description: description || null,
    }),
  })

  if (!insertRes.ok) {
    const err = await insertRes.text()
    return NextResponse.json({ error: err }, { status: insertRes.status })
  }

  const listing = await insertRes.json()
  return NextResponse.json({ success: true, listing: listing[0] })
}

// PATCH /api/marketplace — update listing
export async function PATCH(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { listing_id, ...updates } = body

  if (!listing_id) return NextResponse.json({ error: 'Missing listing_id' }, { status: 400 })

  // Only allow updating certain fields
  const allowed = ['price', 'quantity', 'description', 'condition', 'is_active', 'graded_company', 'graded_grade']
  const filtered: Record<string, unknown> = {}
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key]
  }

  const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/marketplace_listings?id=eq.${listing_id}&seller_id=eq.${body.seller_id}`, {
    method: 'PATCH',
    headers: { ...getHeaders(token), 'Prefer': 'return=representation' },
    body: JSON.stringify(filtered),
  })

  if (!updateRes.ok) {
    const err = await updateRes.text()
    return NextResponse.json({ error: err }, { status: updateRes.status })
  }

  const listing = await updateRes.json()
  return NextResponse.json({ success: true, listing: listing[0] })
}