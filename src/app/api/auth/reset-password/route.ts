import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Simple rate limiter for password reset
const resetAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_RESETS_PER_IP = 5
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Rate limit
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    const record = resetAttempts.get(ip)

    if (record) {
      if (now - record.lastAttempt > WINDOW_MS) {
        resetAttempts.set(ip, { count: 1, lastAttempt: now })
      } else if (record.count >= MAX_RESETS_PER_IP) {
        return NextResponse.json({ error: 'Too many reset attempts. Please try again later.' }, { status: 429 })
      } else {
        record.count++
        record.lastAttempt = now
      }
    } else {
      resetAttempts.set(ip, { count: 1, lastAttempt: now })
    }

    // Send password reset email via Supabase with redirect URL
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tcg-vault-sandy.vercel.app'}/auth/reset-password`

    const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        redirect_to: resetUrl,
      }),
    })

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    })
  } catch (err) {
    console.error('Password reset error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}