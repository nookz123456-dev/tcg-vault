import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// GET — list user's price alerts
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
  })
  if (!userRes.ok) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  const userData = await userRes.json()

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/price_alerts?user_id=eq.${userData.id}&order=created_at.desc&select=*`,
    {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
    }
  )

  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  const alerts = await res.json()
  return NextResponse.json({ alerts })
}

// POST — create a price alert
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
  })
  if (!userRes.ok) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  const userData = await userRes.json()

  const body = await request.json()
  const { card_name, game, card_id, target_price, direction } = body

  if (!card_name || !game || !card_id || !target_price || !direction) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!['pokemon', 'pokemon-jp', 'onepiece'].includes(game)) {
    return NextResponse.json({ error: 'Invalid game' }, { status: 400 })
  }
  if (!['below', 'above'].includes(direction)) {
    return NextResponse.json({ error: 'Invalid direction' }, { status: 400 })
  }
  if (target_price <= 0) {
    return NextResponse.json({ error: 'Target price must be positive' }, { status: 400 })
  }

  // Limit: max 20 alerts per user
  const countRes = await fetch(
    `${SUPABASE_URL}/rest/v1/price_alerts?user_id=eq.${userData.id}&is_active=eq.true&select=id`,
    {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
    }
  )
  const existing = countRes.ok ? await countRes.json() : []
  if (existing.length >= 20) {
    return NextResponse.json({ error: 'Maximum 20 active alerts allowed' }, { status: 400 })
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/price_alerts`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      user_id: userData.id,
      card_name,
      game,
      card_id,
      target_price,
      direction,
      is_active: true,
    }),
  })

  if (!insertRes.ok) {
    const err = await insertRes.text()
    return NextResponse.json({ error: 'Failed to create alert', details: err }, { status: 500 })
  }

  const alert = await insertRes.json()
  return NextResponse.json({ alert: alert[0] })
}

// DELETE — delete a price alert
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const { searchParams } = new URL(request.url)
  const alertId = searchParams.get('id')

  if (!alertId) {
    return NextResponse.json({ error: 'Alert id required' }, { status: 400 })
  }

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
  })
  if (!userRes.ok) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const deleteRes = await fetch(
    `${SUPABASE_URL}/rest/v1/price_alerts?id=eq.${alertId}`,
    {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
    }
  )

  if (!deleteRes.ok) return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PATCH — toggle alert active/inactive
export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const body = await request.json()
  const { id, is_active } = body

  if (!id || is_active === undefined) {
    return NextResponse.json({ error: 'id and is_active required' }, { status: 400 })
  }

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
  })
  if (!userRes.ok) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const patchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/price_alerts?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ is_active }),
    }
  )

  if (!patchRes.ok) return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  const alert = await patchRes.json()
  return NextResponse.json({ alert: alert[0] })
}