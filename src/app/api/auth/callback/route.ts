import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

// Handle auth callbacks (magic link, email confirmation, password reset)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') // login, signup, recovery
  const next = searchParams.get('next') || '/collection'

  if (token_hash && type) {
    // Verify the token with Supabase
    const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_hash, type }),
    })
    const verifyData = await verifyRes.json()

    if (verifyData.access_token) {
      // Redirect to client page that stores the session
      const redirectUrl = new URL('/auth/callback', request.url)
      redirectUrl.searchParams.set('access_token', verifyData.access_token)
      redirectUrl.searchParams.set('refresh_token', verifyData.refresh_token || '')
      redirectUrl.searchParams.set('next', next)
      return NextResponse.redirect(redirectUrl.toString())
    }
  }

  // If verification failed, redirect to login with error
  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', request.url))
}