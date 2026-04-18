import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// GET likes for a thread or reply
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const threadId = searchParams.get('threadId')
  const replyId = searchParams.get('replyId')
  const userId = searchParams.get('userId')

  if (!threadId && !replyId) {
    return NextResponse.json({ error: 'threadId or replyId is required' }, { status: 400 })
  }

  const table = threadId ? 'thread_likes' : 'reply_likes'
  const targetId = threadId || replyId
  const column = threadId ? 'thread_id' : 'reply_id'

  // Get like count
  const countRes = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${targetId}&select=id,user_id`,
    {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    }
  )

  if (!countRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 })
  }

  const likes = await countRes.json()
  const likedByUser = userId ? likes.some((l: { user_id: string }) => l.user_id === userId) : false

  return NextResponse.json({
    count: likes.length,
    liked: likedByUser,
    likers: likes.map((l: { user_id: string }) => l.user_id),
  })
}

// POST - like a thread or reply
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const body = await request.json()
  const { threadId, replyId } = body

  if (!threadId && !replyId) {
    return NextResponse.json({ error: 'threadId or replyId is required' }, { status: 400 })
  }

  // Verify user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
  })
  if (!userRes.ok) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  const userData = await userRes.json()

  const table = threadId ? 'thread_likes' : 'reply_likes'
  const insertData = threadId
    ? { thread_id: threadId, user_id: userData.id }
    : { reply_id: replyId, user_id: userData.id }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(insertData),
  })

  if (!insertRes.ok) {
    const err = await insertRes.text()
    if (err.includes('duplicate') || err.includes('23505')) {
      return NextResponse.json({ error: 'Already liked' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to like', details: err }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE - unlike a thread or reply
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const { searchParams } = new URL(request.url)
  const threadId = searchParams.get('threadId')
  const replyId = searchParams.get('replyId')

  if (!threadId && !replyId) {
    return NextResponse.json({ error: 'threadId or replyId is required' }, { status: 400 })
  }

  // Verify user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
  })
  if (!userRes.ok) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  const userData = await userRes.json()

  const table = threadId ? 'thread_likes' : 'reply_likes'
  const column = threadId ? 'thread_id' : 'reply_id'
  const targetId = threadId || replyId

  const deleteRes = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${targetId}&user_id=eq.${userData.id}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    }
  )

  if (!deleteRes.ok) {
    return NextResponse.json({ error: 'Failed to unlike' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}