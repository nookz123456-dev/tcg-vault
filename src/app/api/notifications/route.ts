import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unread') === 'true'

  // Verify user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
  })

  if (!userRes.ok) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const userData = await userRes.json()

  let query = `user_id=eq.${userData.id}&order=created_at.desc&limit=50&select=*,actor:profiles!notifications_actor_id_fkey(username,avatar_url)`
  if (unreadOnly) query += '&is_read=eq.false'

  const res = await fetch(`${SUPABASE_URL}/rest/v1/notifications?${query}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }

  const notifications = await res.json()

  // Get unread count
  const countRes = await fetch(
    `${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${userData.id}&is_read=eq.false&select=id`,
    {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
    }
  )
  const unread = countRes.ok ? (await countRes.json()).length : 0

  return NextResponse.json({ notifications, unread_count: unread })
}

export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const body = await request.json()
  const { mark_all_read, notification_id } = body

  // Verify user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
  })

  if (!userRes.ok) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const userData = await userRes.json()

  if (mark_all_read) {
    // Mark all as read
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${userData.id}&is_read=eq.false`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      }
    )

    if (!updateRes.ok) {
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (notification_id) {
    // Mark single notification as read
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/notifications?id=eq.${notification_id}&user_id=eq.${userData.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      }
    )

    if (!updateRes.ok) {
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'No action specified' }, { status: 400 })
}