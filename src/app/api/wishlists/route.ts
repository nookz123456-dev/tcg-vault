import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cardId = searchParams.get('cardId')
  const game = searchParams.get('game')
  const userId = searchParams.get('userId')

  let query = 'select=*&order=created_at.desc'
  if (cardId && game) {
    query += `&card_id=eq.${encodeURIComponent(cardId)}&game=eq.${game}`
  }
  if (userId) {
    query += `&user_id=eq.${userId}`
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/wishlists?${query}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch wishlists' }, { status: 500 })
  }

  const wishlists = await res.json()
  return NextResponse.json({ wishlists })
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const body = await request.json()
  const { card_id, game, priority, notes } = body

  if (!card_id || !game) {
    return NextResponse.json({ error: 'card_id and game are required' }, { status: 400 })
  }

  // Verify user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!userRes.ok) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const userData = await userRes.json()

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/wishlists`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      user_id: userData.id,
      card_id,
      game,
      priority: priority || 'medium',
      notes: notes || null,
    }),
  })

  if (!insertRes.ok) {
    const err = await insertRes.text()
    // Check for unique constraint violation (already wishlisted)
    if (err.includes('duplicate') || err.includes('unique') || err.includes('23505')) {
      return NextResponse.json({ error: 'Already in wishlist' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to add to wishlist', details: err }, { status: 500 })
  }

  const wishlist = await insertRes.json()
  return NextResponse.json({ wishlist })
}

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const body = await request.json()
  const { card_id, game } = body

  if (!card_id || !game) {
    return NextResponse.json({ error: 'card_id and game are required' }, { status: 400 })
  }

  // Verify user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!userRes.ok) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const userData = await userRes.json()

  const deleteRes = await fetch(
    `${SUPABASE_URL}/rest/v1/wishlists?user_id=eq.${userData.id}&card_id=eq.${encodeURIComponent(card_id)}&game=eq.${game}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  if (!deleteRes.ok) {
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}