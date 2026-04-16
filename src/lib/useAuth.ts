'use client'

import { useState, useEffect, useCallback } from 'react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export interface User {
  id: string
  email: string
  access_token: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem('tcg-vault-session')
    const guest = localStorage.getItem('tcg-vault-guest')

    if (session) {
      try {
        const data = JSON.parse(session)
        if (data.user && data.access_token) {
          // Verify token is still valid
          fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${data.access_token}`,
            },
          }).then(res => {
            if (res.ok) {
              setUser({
                id: data.user.id,
                email: data.user.email,
                access_token: data.access_token,
              })
            } else {
              // Token expired, clear session
              localStorage.removeItem('tcg-vault-session')
            }
            setLoading(false)
          }).catch(() => {
            // Network error, use cached session
            setUser({
              id: data.user.id,
              email: data.user.email,
              access_token: data.access_token,
            })
            setLoading(false)
          })
        } else {
          setLoading(false)
        }
      } catch {
        setLoading(false)
      }
    } else if (guest) {
      setIsGuest(true)
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('tcg-vault-session')
    localStorage.removeItem('tcg-vault-guest')
    setUser(null)
    setIsGuest(false)
    window.location.href = '/login'
  }, [])

  const getAuthHeaders = useCallback(() => {
    if (user?.access_token) {
      return {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${user.access_token}`,
        'Content-Type': 'application/json',
      }
    }
    return {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    }
  }, [user])

  const isAuthenticated = !!user || isGuest

  return { user, isGuest, isAuthenticated, loading, logout, getAuthHeaders }
}