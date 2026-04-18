import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const threadId = searchParams.get('threadId')

  if (!threadId) {
    return NextResponse.json({ error: 'threadId is required' }, { status: 400 })
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/discussion_replies?thread_id=eq.${threadId}&select=*,profiles(username,avatar_url)&order=created_at.asc&limit=200`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 })
  }

  const replies = await res.json()
  return NextResponse.json({ replies })
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const body = await request.json()
  const { thread_id, content } = body

  if (!thread_id || !content) {
    return NextResponse.json({ error: 'thread_id and content are required' }, { status: 400 })
  }

  if (content.length < 1 || content.length > 3000) {
    return NextResponse.json({ error: 'Content must be 1-3000 characters' }, { status: 400 })
  }

  // Verify user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
  })

  if (!userRes.ok) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const userData = await userRes.json()

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/discussion_replies`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      thread_id,
      user_id: userData.id,
      content,
    }),
  })

  if (!insertRes.ok) {
    const err = await insertRes.text()
    return NextResponse.json({ error: 'Failed to post reply', details: err }, { status: 500 })
  }

  const reply = await insertRes.json()
  return NextResponse.json({ reply: reply[0] })
}