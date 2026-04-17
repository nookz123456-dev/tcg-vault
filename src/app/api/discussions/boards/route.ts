import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/discussion_boards?order=sort_order.asc&select=*`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 })
  }

  const boards = await res.json()

  // Get thread counts for each board
  const boardsWithCounts = await Promise.all(boards.map(async (board: { id: string; [key: string]: unknown }) => {
    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/discussion_threads?board_id=eq.${board.id}&select=id`,
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
    )
    const threads = countRes.ok ? await countRes.json() : []
    return { ...board, thread_count: threads.length }
  }))

  return NextResponse.json({ boards: boardsWithCounts })
}