import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter for signup
const signupAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_SIGNUPS_PER_IP = 3
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    const record = signupAttempts.get(ip)

    if (record) {
      if (now - record.lastAttempt > WINDOW_MS) {
        signupAttempts.set(ip, { count: 1, lastAttempt: now })
      } else if (record.count >= MAX_SIGNUPS_PER_IP) {
        return NextResponse.json({
          error: 'Too many signup attempts. Please try again later.',
        }, { status: 429 })
      } else {
        record.count++
        record.lastAttempt = now
      }
    } else {
      signupAttempts.set(ip, { count: 1, lastAttempt: now })
    }

    // Signup with Supabase
    const signupRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        data: { username: username || email.split('@')[0], display_name: username || email.split('@')[0] },
      }),
    })

    const signupData = await signupRes.json()

    if (!signupRes.ok || signupData.error) {
      const msg = signupData.msg || signupData.error_description || signupData.error || 'Signup failed'
      if (msg.includes('already registered')) {
        return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 })
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // Auto-confirm the user
    if (signupData.id) {
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${signupData.id}`, {
        method: 'PUT',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_confirm: true }),
      })

      // Create profile with username
      if (username) {
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${signupData.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            username: username.trim(),
            display_name: username.trim(),
          }),
        })
      }

      // Auto-login
      const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      const loginData = await loginRes.json()

      return NextResponse.json({
        success: true,
        user: signupData,
        session: loginData.access_token ? loginData : null,
      })
    }

    return NextResponse.json({ success: true, user: signupData })
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}