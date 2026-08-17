import { NextRequest, NextResponse } from 'next/server'
import { getMarvelPriceStore, saveMarvelPrices } from '@/lib/marvel-prices.server'

// File-backed admin pricing for Marvel Hero Rush cards.
// Auth today: a shared admin key (MARVEL_ADMIN_KEY) — the old Supabase auth
// backend is gone, and this is a localhost-first admin tool. When migrating
// to Supabase, swap this check for the profiles.role === 'admin' pattern used
// in /api/admin.
function authorized(req: NextRequest): boolean {
  const expected = process.env.MARVEL_ADMIN_KEY
  const provided = req.headers.get('x-admin-key') || ''
  if (expected) return provided === expected
  // No key configured → only allow from localhost (dev convenience).
  const host = req.headers.get('host') || ''
  return host.startsWith('localhost') || host.startsWith('127.0.0.1')
}

// GET — current prices (public: the site shows these anyway)
export async function GET() {
  const store = await getMarvelPriceStore()
  return NextResponse.json(store)
}

// POST — upsert a batch of prices. Body: { updates: { [cardId]: number | null } }
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized — invalid admin key' }, { status: 401 })
  }
  let body: { updates?: Record<string, number | null> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const updates = body.updates
  if (!updates || typeof updates !== 'object') {
    return NextResponse.json({ error: 'Missing updates object' }, { status: 400 })
  }
  // sanitize: values must be positive numbers or null
  const clean: Record<string, number | null> = {}
  for (const [id, v] of Object.entries(updates)) {
    if (v === null || v === undefined || v === ('' as unknown)) clean[id] = null
    else {
      const n = Number(v)
      if (Number.isFinite(n) && n >= 0) clean[id] = n
    }
  }
  const store = await saveMarvelPrices(clean)
  return NextResponse.json({ success: true, count: Object.keys(clean).length, updatedAt: store.updatedAt })
}
