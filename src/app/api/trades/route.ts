import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const status = searchParams.get('status') || 'pending'

  let query = 'select=*,from_user:profiles!trade_offers_from_user_id_fkey(username,avatar_url),to_user:profiles!trade_offers_to_user_id_fkey(username,avatar_url)&order=created_at.desc&limit=50'

  if (userId) {
    query += `&or=(from_user_id.eq.${userId},to_user_id.eq.${userId})`
  }
  if (status !== 'all') {
    query += `&status=eq.${status}`
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/trade_offers?${query}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch trade offers' }, { status: 500 })
  }

  const offers = await res.json()
  return NextResponse.json({ offers })
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const body = await request.json()
  const { to_user_id, offered_card_id, offered_game, requested_card_id, requested_game, message } = body

  if (!to_user_id || !offered_card_id || !offered_game || !requested_card_id || !requested_game) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
  })

  if (!userRes.ok) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const userData = await userRes.json()

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/trade_offers`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      from_user_id: userData.id,
      to_user_id,
      offered_card_id,
      offered_game,
      requested_card_id,
      requested_game,
      message: message || null,
    }),
  })

  if (!insertRes.ok) {
    const err = await insertRes.text()
    return NextResponse.json({ error: 'Failed to create trade offer', details: err }, { status: 500 })
  }

  const offer = await insertRes.json()

  // Create notification for recipient
  await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: to_user_id,
      actor_id: userData.id,
      type: 'trade_offer',
      reference_id: offer[0].id,
      reference_type: 'trade',
      message: 'You received a trade offer!',
    }),
  })

  return NextResponse.json({ offer: offer[0] })
}

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const body = await request.json()
  const { offer_id, status } = body

  if (!offer_id || !status) {
    return NextResponse.json({ error: 'offer_id and status are required' }, { status: 400 })
  }

  if (!['accepted', 'rejected', 'cancelled', 'completed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Verify user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
  })

  if (!userRes.ok) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const userData = await userRes.json()

  // Only from_user can cancel, to_user can accept/reject, either can mark completed
  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/trade_offers?id=eq.${offer_id}&or=(from_user_id.eq.${userData.id},to_user_id.eq.${userData.id})`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    }
  )

  if (!updateRes.ok) {
    return NextResponse.json({ error: 'Failed to update trade offer' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}