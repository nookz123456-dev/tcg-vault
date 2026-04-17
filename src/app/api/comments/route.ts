import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cardId = searchParams.get('cardId')
  const game = searchParams.get('game')

  if (!cardId || !game) {
    return NextResponse.json({ error: 'cardId and game are required' }, { status: 400 })
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/card_comments?card_id=eq.${encodeURIComponent(cardId)}&game=eq.${game}&order=created_at.desc&limit=50&select=*,profiles(username,avatar_url)`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }

  const comments = await res.json()
  return NextResponse.json({ comments })
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const body = await request.json()
  const { card_id, game, content, parent_id } = body

  if (!card_id || !game || !content) {
    return NextResponse.json({ error: 'card_id, game, and content are required' }, { status: 400 })
  }

  if (content.length > 1000) {
    return NextResponse.json({ error: 'Content must be 1000 characters or less' }, { status: 400 })
  }

  // Verify user and get user_id
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
  const userId = userData.id

  // Insert comment
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/card_comments`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      user_id: userId,
      card_id,
      game,
      content,
      parent_id: parent_id || null,
    }),
  })

  if (!insertRes.ok) {
    const err = await insertRes.text()
    return NextResponse.json({ error: 'Failed to post comment', details: err }, { status: 500 })
  }

  const comment = await insertRes.json()
  return NextResponse.json({ comment })
}

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const { searchParams } = new URL(request.url)
  const commentId = searchParams.get('id')

  if (!commentId) {
    return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
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

  // Delete only if user owns the comment
  const deleteRes = await fetch(
    `${SUPABASE_URL}/rest/v1/card_comments?id=eq.${commentId}&user_id=eq.${userData.id}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  if (!deleteRes.ok) {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}