import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/collection'

  if (code) {
    // Exchange code for session
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_code: code,
        }),
      })
      const data = await res.json()

      if (data.access_token) {
        // Redirect to callback page that stores session
        const redirectUrl = new URL('/auth/callback', request.url)
        redirectUrl.searchParams.set('access_token', data.access_token)
        redirectUrl.searchParams.set('refresh_token', data.refresh_token || '')
        redirectUrl.searchParams.set('next', next)
        return NextResponse.redirect(redirectUrl.toString())
      }
    } catch (err) {
      console.error('OAuth code exchange error:', err)
    }
  }

  // Fallback: redirect to login
  return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
}