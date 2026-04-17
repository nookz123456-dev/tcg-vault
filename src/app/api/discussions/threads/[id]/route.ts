import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Fetch thread
  const threadRes = await fetch(
    `${SUPABASE_URL}/rest/v1/discussion_threads?id=eq.${id}&select=*,profiles(username,avatar_url),discussion_boards(name,slug,icon)`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  if (!threadRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 })
  }

  const threads = await threadRes.json()
  if (threads.length === 0) {
    return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
  }

  const thread = threads[0]

  // Fetch replies
  const repliesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/discussion_replies?thread_id=eq.${id}&select=*,profiles(username,avatar_url)&order=created_at.asc&limit=200`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  const replies = repliesRes.ok ? await repliesRes.json() : []

  return NextResponse.json({ thread, replies })
}