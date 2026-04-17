'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function AuthCallbackContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const next = searchParams.get('next') || '/collection'

    if (accessToken) {
      // Store session
      localStorage.setItem('tcg-vault-session', JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'bearer',
        user: { id: 'pending' },
      }))

      // Fetch user info to complete session
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

      fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
        },
      })
        .then(r => r.json())
        .then(user => {
          const session = {
            access_token: accessToken,
            refresh_token: refreshToken || '',
            token_type: 'bearer',
            user,
          }
          localStorage.setItem('tcg-vault-session', JSON.stringify(session))
          window.location.href = next
        })
        .catch(() => {
          window.location.href = next
        })
    } else {
      window.location.href = '/login?error=no_token'
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa]">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🔐</div>
        <p className="text-[#5c6078]">Verifying...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f5f6fa]"><div className="text-4xl animate-pulse">🔐</div></div>}>
      <AuthCallbackContent />
    </Suspense>
  )
}