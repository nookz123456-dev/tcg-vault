'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/useAuth'

export interface Comment {
  id: string
  user_id: string
  card_id: string
  game: string
  content: string
  parent_id: string | null
  created_at: string
  updated_at: string
  profiles?: { username: string; avatar_url: string | null } | null
}

export function useComments() {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)

  const fetchComments = useCallback(async (cardId: string, game: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/comments?cardId=${encodeURIComponent(cardId)}&game=${game}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  const addComment = useCallback(async (cardId: string, game: string, content: string, parentId?: string) => {
    if (!user) return null

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
      body: JSON.stringify({ card_id: cardId, game, content, parent_id: parentId || null }),
    })

    if (res.ok) {
      const data = await res.json()
      // Re-fetch to get the profile join
      await fetchComments(cardId, game)
      return data.comment
    }
    return null
  }, [user, fetchComments])

  const deleteComment = useCallback(async (commentId: string, cardId: string, game: string) => {
    if (!user) return false

    const res = await fetch(`/api/comments?id=${commentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${user.access_token}` },
    })

    if (res.ok) {
      setComments(prev => prev.filter(c => c.id !== commentId))
      return true
    }
    return false
  }, [user])

  return { comments, loading, fetchComments, addComment, deleteComment }
}