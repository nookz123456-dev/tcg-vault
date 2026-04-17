'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/useAuth'

interface Thread {
  id: string
  board_id: string
  title: string
  content: string
  is_pinned: boolean
  is_locked: boolean
  views: number
  created_at: string
  profiles: { username: string; avatar_url: string | null }
  discussion_boards: { name: string; slug: string; icon: string }
}

interface Reply {
  id: string
  content: string
  created_at: string
  profiles: { username: string; avatar_url: string | null }
}

export default function ThreadPage() {
  const params = useParams()
  const router = useRouter()
  const threadId = params.id as string
  const { user } = useAuth()

  const [thread, setThread] = useState<Thread | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [newReply, setNewReply] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/discussions/threads/${threadId}`)
      .then(r => r.json())
      .then(data => {
        setThread(data.thread)
        setReplies(data.replies || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [threadId])

  const handleReply = async () => {
    if (!user || !newReply.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/discussions/replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({
          thread_id: threadId,
          content: newReply.trim(),
        }),
      })
      if (res.ok) {
        setNewReply('')
        // Refresh replies
        const data = await fetch(`/api/discussions/threads/${threadId}`).then(r => r.json())
        setReplies(data.replies || [])
      }
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="shimmer h-8 w-3/4 rounded-lg mb-4" />
          <div className="shimmer h-4 w-1/2 rounded mb-8" />
          <div className="shimmer h-40 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4 opacity-50">🔍</div>
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Thread not found</h1>
          <button onClick={() => router.push('/discussions')} className="text-amber-400 hover:text-amber-300 text-sm font-semibold">
            ← Back to Discussions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--warm-400)] mb-4">
          <button onClick={() => router.push('/discussions')} className="hover:text-amber-400 transition-colors">
            Discussions
          </button>
          <span>/</span>
          <span>{thread.discussion_boards?.icon} {thread.discussion_boards?.name}</span>
        </div>

        {/* Thread Header */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            {thread.is_pinned && <span className="text-amber-400">📌</span>}
            {thread.is_locked && <span className="text-red-400">🔒</span>}
            <h1 className="text-xl font-extrabold text-[var(--foreground)]">{thread.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--warm-400)]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400">
                {thread.profiles?.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <a href={`/u/${thread.profiles?.username || ''}`} className="font-semibold text-amber-400 hover:text-amber-300">
                {thread.profiles?.username || 'Unknown'}
              </a>
            </div>
            <span>{formatDate(thread.created_at)}</span>
            <span>👁 {thread.views} views</span>
          </div>
        </div>

        {/* Thread Content (styled as first post) */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 mb-6">
          <div className="text-sm text-[var(--warm-200)] leading-relaxed whitespace-pre-wrap">{thread.content}</div>
        </div>

        {/* Replies */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            Replies ({replies.length})
          </h2>
        </div>

        {replies.length > 0 && (
          <div className="space-y-3 mb-6">
            {replies.map((reply, index) => (
              <div key={reply.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400 flex-shrink-0 overflow-hidden">
                    {reply.profiles?.avatar_url ? (
                      <img src={reply.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      reply.profiles?.username?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <a href={`/u/${reply.profiles?.username || ''}`} className="text-sm font-semibold text-amber-400 hover:text-amber-300">
                    {reply.profiles?.username || 'Unknown'}
                  </a>
                  <span className="text-[10px] text-[var(--warm-500)]">{timeAgo(reply.created_at)}</span>
                  <span className="text-[10px] text-[var(--warm-500)] ml-auto">#{index + 1}</span>
                </div>
                <div className="text-sm text-[var(--warm-300)] leading-relaxed whitespace-pre-wrap pl-9">{reply.content}</div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Form */}
        {!thread.is_locked ? (
          user ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[var(--foreground)] mb-3">Post a Reply</h3>
              <textarea
                value={newReply}
                onChange={e => setNewReply(e.target.value)}
                placeholder="Write your reply..."
                maxLength={3000}
                rows={3}
                className="w-full px-4 py-2.5 bg-[var(--surface-1)] border border-[var(--card-border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--warm-500)] focus:outline-none focus:border-amber-500/50 resize-none text-sm"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-[var(--warm-500)]">{newReply.length}/3000</span>
                <button
                  onClick={handleReply}
                  disabled={submitting || !newReply.trim()}
                  className="px-5 py-2 bg-amber-500 text-[var(--warm-900)] rounded-xl text-xs font-bold hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 text-center">
              <p className="text-sm text-[var(--warm-400)]">Sign in to join the discussion</p>
              <a href="/login" className="inline-block mt-3 px-5 py-2 bg-amber-500 text-[var(--warm-900)] rounded-xl text-xs font-bold hover:bg-amber-400 transition-all">
                Sign In
              </a>
            </div>
          )
        ) : (
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 text-center">
            <p className="text-sm text-red-400">🔒 This thread is locked</p>
          </div>
        )}
      </div>
    </div>
  )
}