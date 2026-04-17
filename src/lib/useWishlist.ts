'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/useAuth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export interface WishlistItem {
  id: string
  user_id: string
  card_id: string
  game: string
  priority: string
  notes: string | null
  created_at: string
}

export function useWishlist() {
  const { user, isAuthenticated } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchWishlist = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/wishlists?user_id=eq.${user.id}&order=created_at.desc&select=*`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${user.access_token}`,
          },
        }
      )
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWishlist()
    }
  }, [isAuthenticated, user, fetchWishlist])

  const isInWishlist = useCallback((cardId: string, game: string): boolean => {
    return items.some(item => item.card_id === cardId && item.game === game)
  }, [items])

  const toggleWishlist = useCallback(async (cardId: string, game: string, priority: string = 'medium') => {
    if (!user) return false

    const existing = items.find(item => item.card_id === cardId && item.game === game)

    if (existing) {
      // Remove from wishlist
      const res = await fetch('/api/wishlists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
        body: JSON.stringify({ card_id: cardId, game }),
      })
      if (res.ok) {
        setItems(prev => prev.filter(item => !(item.card_id === cardId && item.game === game)))
        return false
      }
    } else {
      // Add to wishlist
      const res = await fetch('/api/wishlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
        body: JSON.stringify({ card_id: cardId, game, priority }),
      })
      if (res.ok || res.status === 409) {
        await fetchWishlist() // Refresh
        return true
      }
    }
    return isInWishlist(cardId, game)
  }, [user, items, fetchWishlist, isInWishlist])

  return { items, loading, isInWishlist, toggleWishlist, refetch: fetchWishlist }
}