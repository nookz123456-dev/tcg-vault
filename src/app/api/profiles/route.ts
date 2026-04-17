import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const userId = searchParams.get('id')

  let query: string
  if (username) {
    query = `username=eq.${encodeURIComponent(username)}&select=*`
  } else if (userId) {
    query = `id=eq.${userId}&select=*`
  } else {
    return NextResponse.json({ error: 'username or id is required' }, { status: 400 })
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?${query}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }

  const profiles = await res.json()
  if (profiles.length === 0) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const profile = profiles[0]

  // Fetch follower/following counts
  const [followersRes, followingRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/follows?following_id=eq.${profile.id}&select=follower_id`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    }),
    fetch(`${SUPABASE_URL}/rest/v1/follows?follower_id=eq.${profile.id}&select=following_id`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    }),
  ])

  const followers = followersRes.ok ? await followersRes.json() : []
  const following = followingRes.ok ? await followingRes.json() : []

  // Fetch collection count
  const collectionsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/collections?user_id=eq.${profile.id}&select=id`,
    {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    }
  )
  const collections = collectionsRes.ok ? await collectionsRes.json() : []

  return NextResponse.json({
    ...profile,
    followers_count: followers.length,
    following_count: following.length,
    collections_count: collections.length,
  })
}

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const body = await request.json()

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

  // Update profile
  const updateData: Record<string, unknown> = {}
  if (body.bio !== undefined) updateData.bio = body.bio
  if (body.username !== undefined) updateData.username = body.username
  if (body.is_public !== undefined) updateData.is_public = body.is_public
  if (body.collection_public !== undefined) updateData.collection_public = body.collection_public
  if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url

  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userData.id}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(updateData),
    }
  )

  if (!updateRes.ok) {
    const err = await updateRes.text()
    return NextResponse.json({ error: 'Failed to update profile', details: err }, { status: 500 })
  }

  const updated = await updateRes.json()
  return NextResponse.json({ profile: updated[0] })
}