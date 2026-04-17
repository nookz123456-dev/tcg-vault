import { NextRequest, NextResponse } from 'next/server'

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || ''

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token } = body

  if (!token) {
    return NextResponse.json({ success: false, error: 'Missing captcha token' }, { status: 400 })
  }

  if (!TURNSTILE_SECRET_KEY) {
    // If no secret key configured, skip verification (dev mode)
    console.warn('Turnstile secret key not configured — skipping verification')
    return NextResponse.json({ success: true })
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
      }),
    })

    const data = await res.json()

    if (data.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: 'Captcha verification failed', codes: data['error-codes'] }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Verification service unavailable' }, { status: 500 })
  }
}