import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const body = await request.json()
  const { following_id } = body

  if (!following_id) {
    return NextResponse.json({ error: 'following_id is required' }, { status: 400 })
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

  if (userData.id === following_id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/follows`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      follower_id: userData.id,
      following_id,
    }),
  })

  if (!insertRes.ok) {
    const err = await insertRes.text()
    if (err.includes('duplicate') || err.includes('23505')) {
      return NextResponse.json({ error: 'Already following' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to follow', details: err }, { status: 500 })
  }

  const follow = await insertRes.json()
  return NextResponse.json({ follow })
}

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const body = await request.json()
  const { following_id } = body

  if (!following_id) {
    return NextResponse.json({ error: 'following_id is required' }, { status: 400 })
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
    `${SUPABASE_URL}/rest/v1/follows?follower_id=eq.${userData.id}&following_id=eq.${following_id}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  if (!deleteRes.ok) {
    return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}