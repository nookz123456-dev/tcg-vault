import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const boardId = searchParams.get('boardId')
  const sort = searchParams.get('sort') || 'recent'

  let query = 'select=*,profiles(username,avatar_url),discussion_boards(name,slug,icon)'
  if (boardId) query += `&board_id=eq.${boardId}`
  if (sort === 'recent') query += '&order=created_at.desc'
  else if (sort === 'popular') query += '&order=views.desc'

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/discussion_threads?${query}&limit=50`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
  }

  const threads = await res.json()

  // Fetch reply counts for each thread
  const threadsWithCounts = await Promise.all(threads.map(async (thread: { id: string; [key: string]: unknown }) => {
    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/discussion_replies?thread_id=eq.${thread.id}&select=id`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
    )
    const replies = countRes.ok ? await countRes.json() : []
    return { ...thread, reply_count: replies.length }
  }))

  return NextResponse.json({ threads: threadsWithCounts })
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const body = await request.json()
  const { board_id, title, content, image_url } = body

  if (!board_id || !title || !content) {
    return NextResponse.json({ error: 'board_id, title, and content are required' }, { status: 400 })
  }

  if (title.length < 3 || title.length > 200) {
    return NextResponse.json({ error: 'Title must be 3-200 characters' }, { status: 400 })
  }

  if (content.length < 1 || content.length > 5000) {
    return NextResponse.json({ error: 'Content must be 1-5000 characters' }, { status: 400 })
  }

  // Verify user
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` },
  })

  if (!userRes.ok) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const userData = await userRes.json()

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/discussion_threads`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      board_id,
      user_id: userData.id,
      title,
      content,
      image_url: image_url || null,
    }),
  })

  if (!insertRes.ok) {
    const err = await insertRes.text()
    return NextResponse.json({ error: 'Failed to create thread', details: err }, { status: 500 })
  }

  const thread = await insertRes.json()
  return NextResponse.json({ thread: thread[0] })
}