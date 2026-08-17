import { NextRequest, NextResponse } from 'next/server'
import { getVariants, addVariant, removeVariant } from '@/lib/marvel-variants.server'

// Admin-managed rarity variants. Same auth as pricing (MARVEL_ADMIN_KEY header,
// localhost fallback in dev).
function authorized(req: NextRequest): boolean {
  const expected = process.env.MARVEL_ADMIN_KEY
  const provided = req.headers.get('x-admin-key') || ''
  if (expected) return provided === expected
  const host = req.headers.get('host') || ''
  return host.startsWith('localhost') || host.startsWith('127.0.0.1')
}

export async function GET() {
  return NextResponse.json({ variants: await getVariants() })
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { action?: string; cardNo?: string; rarity?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { action, cardNo, rarity } = body
  if (!cardNo || !rarity) {
    return NextResponse.json({ error: 'ต้องระบุ cardNo และ rarity' }, { status: 400 })
  }
  try {
    const variants = action === 'remove' ? await removeVariant(cardNo, rarity) : await addVariant(cardNo, rarity)
    return NextResponse.json({ success: true, variants })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || 'บันทึกไม่สำเร็จ' }, { status: 500 })
  }
}
