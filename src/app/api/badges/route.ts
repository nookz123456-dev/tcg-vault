import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/badge_definitions?order=name.asc&select=*`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
  }

  const badges = await res.json()
  return NextResponse.json({ badges })
}