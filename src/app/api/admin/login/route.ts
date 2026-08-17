import { NextRequest, NextResponse } from 'next/server'

// Verify the admin password against MARVEL_ADMIN_KEY (server-side, so the real
// password never ships to the client). Falls back to allowing localhost when
// no key is configured (dev convenience).
export async function POST(req: NextRequest) {
  let key = ''
  try {
    key = (await req.json())?.key || ''
  } catch {
    /* ignore */
  }

  const expected = process.env.MARVEL_ADMIN_KEY
  if (expected) {
    const ok = key === expected
    return NextResponse.json({ ok }, { status: ok ? 200 : 401 })
  }

  // No key configured → only allow from localhost.
  const host = req.headers.get('host') || ''
  const local = host.startsWith('localhost') || host.startsWith('127.0.0.1')
  return NextResponse.json({ ok: local, dev: true }, { status: local ? 200 : 401 })
}
