'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ImageUpload from '@/components/ImageUpload'
import { useAuth } from '@/lib/useAuth'
import { useT, useLocale } from '@/lib/i18n'

interface Thread {
  id: string
  board_id: string
  title: string
  content: string
  image_url?: string
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
  image_url?: string
  created_at: string
  profiles: { username: string; avatar_url: string | null }
  like_count: number
  liked: boolean
}

export default function ThreadPage() {
  const params = useParams()
  const router = useRouter()
  const threadId = params.id as string
  const { user } = useAuth()
  const t = useT()
  const { locale } = useLocale()
  const isThai = locale === 'th'

  const [thread, setThread] = useState<Thread | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [newReply, setNewReply] = useState('')
  const [replyImage, setReplyImage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [threadLikes, setThreadLikes] = useState<{ count: number; liked: boolean }>({ count: 0, liked: false })
  const [likingThread, setLikingThread] = useState(false)

  const fetchLikes = useCallback(async (targetId: string, type: 'thread' | 'reply') => {
    const table = type === 'thread' ? 'threadId' : 'replyId'
    const userId = user?.id || ''
    try {
      const res = await fetch(`/api/likes?${table}=${targetId}${userId ? `&userId=${userId}` : ''}`)
      if (res.ok) {
        const data = await res.json()
        return { count: data.count, liked: data.liked }
      }
    } catch { /* ignore */ }
    return { count: 0, liked: false }
  }, [user])

  useEffect(() => {
    fetch(`/api/discussions/threads/${threadId}`)
      .then(r => r.json())
      .then(async (data) => {
        setThread(data.thread)
        setReplies(data.replies || [])
        setLoading(false)
        // Fetch thread likes
        const threadLikeData = await fetchLikes(threadId, 'thread')
        setThreadLikes(threadLikeData)
        // Fetch reply likes
        const repliesWithLikes = await Promise.all(
          (data.replies || []).map(async (reply: Reply) => {
            const likeData = await fetchLikes(reply.id, 'reply')
            return { ...reply, like_count: likeData.count, liked: likeData.liked }
          })
        )
        setReplies(repliesWithLikes)
      })
      .catch(() => setLoading(false))
  }, [threadId, fetchLikes])

  const handleLikeThread = async () => {
    if (!user || likingThread) return
    setLikingThread(true)

    try {
      if (threadLikes.liked) {
        // Unlike
        const res = await fetch(`/api/likes?threadId=${threadId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.access_token}` },
        })
        if (res.ok) {
          setThreadLikes(prev => ({ count: prev.count - 1, liked: false }))
        }
      } else {
        // Like
        const res = await fetch('/api/likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}`,
          },
          body: JSON.stringify({ threadId }),
        })
        if (res.ok) {
          setThreadLikes(prev => ({ count: prev.count + 1, liked: true }))
        }
      }
    } catch { /* ignore */ }
    setLikingThread(false)
  }

  const handleLikeReply = async (replyId: string, currentLiked: boolean) => {
    if (!user) return

    try {
      if (currentLiked) {
        const res = await fetch(`/api/likes?replyId=${replyId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user.access_token}` },
        })
        if (res.ok) {
          setReplies(prev => prev.map(r =>
            r.id === replyId ? { ...r, like_count: r.like_count - 1, liked: false } : r
          ))
        }
      } else {
        const res = await fetch('/api/likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}`,
          },
          body: JSON.stringify({ replyId }),
        })
        if (res.ok) {
          setReplies(prev => prev.map(r =>
            r.id === replyId ? { ...r, like_count: r.like_count + 1, liked: true } : r
          ))
        }
      }
    } catch { /* ignore */ }
  }

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
          image_url: replyImage || undefined,
        }),
      })
      if (res.ok) {
        setNewReply('')
        setReplyImage('')
        const data = await fetch(`/api/discussions/threads/${threadId}`).then(r => r.json())
        const repliesWithLikes = await Promise.all(
          (data.replies || []).map(async (reply: Reply) => {
            const likeData = await fetchLikes(reply.id, 'reply')
            return { ...reply, like_count: likeData.count, liked: likeData.liked }
          })
        )
        setReplies(repliesWithLikes)
      }
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ${isThai ? 'ที่แล้ว' : 'ago'}`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ${isThai ? 'ที่แล้ว' : 'ago'}`
    const days = Math.floor(hours / 24)
    return `${days}d ${isThai ? 'ที่แล้ว' : 'ago'}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isThai ? 'th-TH' : undefined, {
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
          <h1 className="text-xl font-bold text-[#1e2235] mb-2">
            {isThai ? 'ไม่พบกระทู้' : 'Thread not found'}
          </h1>
          <button onClick={() => router.push('/discussions')} className="text-[#6366f1] text-sm font-semibold">
            ← {isThai ? 'กลับไปกระดานสนทนา' : 'Back to Discussions'}
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
        <div className="flex items-center gap-2 text-xs text-[#8b8fa6] mb-4">
          <button onClick={() => router.push('/discussions')} className="hover:text-[#6366f1] transition-colors">
            {isThai ? 'กระดานสนทนา' : 'Discussions'}
          </button>
          <span>/</span>
          <span>{thread.discussion_boards?.icon} {thread.discussion_boards?.name}</span>
        </div>

        {/* Thread Header */}
        <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            {thread.is_pinned && <span className="text-[#6366f1]">📌</span>}
            {thread.is_locked && <span className="text-red-400">🔒</span>}
            <h1 className="text-xl font-extrabold text-[#1e2235]">{thread.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#8b8fa6]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#6366f1]/20 flex items-center justify-center text-[10px] font-bold text-[#6366f1]">
                {thread.profiles?.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <a href={`/u/${thread.profiles?.username || ''}`} className="font-semibold text-[#6366f1]">
                {thread.profiles?.username || 'Unknown'}
              </a>
            </div>
            <span>{formatDate(thread.created_at)}</span>
            <span>👁 {thread.views}</span>
          </div>
        </div>

        {/* Thread Content */}
        <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5 mb-4">
          <div className="text-sm text-[#5c6078] leading-relaxed whitespace-pre-wrap">{thread.content}</div>
          {thread.image_url && (
            <div className="mt-3">
              <img src={thread.image_url} alt="Thread image" className="max-w-full max-h-96 object-contain rounded-xl border border-[#e8eaf0]" />
            </div>
          )}
          {/* Like Button for Thread */}
          <div className="mt-4 pt-3 border-t border-[#e8eaf0] flex items-center gap-4">
            <button
              onClick={handleLikeThread}
              disabled={likingThread || !user}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                threadLikes.liked
                  ? 'bg-red-50 text-red-500 border border-red-200'
                  : 'bg-[#f5f6fa] text-[#5c6078] border border-[#e8eaf0] hover:text-red-500 hover:border-red-200'
              } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {threadLikes.liked ? '❤️' : '🤍'} {threadLikes.count > 0 ? threadLikes.count : isThai ? 'ถูกใจ' : 'Like'}
            </button>
          </div>
        </div>

        {/* Replies */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#1e2235]">
            {isThai ? 'ความคิดเห็น' : 'Replies'} ({replies.length})
          </h2>
        </div>

        {replies.length > 0 && (
          <div className="space-y-3 mb-6">
            {replies.map((reply, index) => (
              <div key={reply.id} className="bg-white border border-[#e8eaf0] rounded-2xl p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-full bg-[#6366f1]/20 flex items-center justify-center text-[10px] font-bold text-[#6366f1] flex-shrink-0 overflow-hidden">
                    {reply.profiles?.avatar_url ? (
                      <img src={reply.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      reply.profiles?.username?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <a href={`/u/${reply.profiles?.username || ''}`} className="text-sm font-semibold text-[#6366f1]">
                    {reply.profiles?.username || 'Unknown'}
                  </a>
                  <span className="text-[10px] text-[#b5b8c8]">{timeAgo(reply.created_at)}</span>
                  <span className="text-[10px] text-[#b5b8c8] ml-auto">#{index + 1}</span>
                </div>
                <div className="text-sm text-[#5c6078] leading-relaxed whitespace-pre-wrap pl-9">{reply.content}</div>
                {reply.image_url && (
                  <div className="pl-9 mt-2">
                    <img src={reply.image_url} alt="Reply image" className="max-w-full max-h-64 object-contain rounded-lg border border-[#e8eaf0]" />
                  </div>
                )}
                {/* Like Button for Reply */}
                <div className="pl-9 mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleLikeReply(reply.id, reply.liked)}
                    disabled={!user}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      reply.liked
                        ? 'bg-red-50 text-red-500'
                        : 'text-[#8b8fa6] hover:text-red-500'
                    } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {reply.liked ? '❤️' : '🤍'} {reply.like_count > 0 ? reply.like_count : ''}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Form */}
        {!thread.is_locked ? (
          user ? (
            <div className="bg-white border border-[#e8eaf0] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[#1e2235] mb-3">
                {isThai ? 'เขียนความคิดเห็น' : 'Post a Reply'}
              </h3>
              <textarea
                value={newReply}
                onChange={e => setNewReply(e.target.value)}
                placeholder={isThai ? 'เขียนความคิดเห็นของคุณ...' : 'Write your reply...'}
                maxLength={3000}
                rows={3}
                className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder:text-[#b5b8c8] focus:outline-none focus:border-[#6366f1]/50 resize-none text-sm"
              />
              <ImageUpload
                value={replyImage}
                onChange={url => setReplyImage(url)}
                label={isThai ? 'แนบรูปภาพ' : 'Attach Image'}
                folder="discussion-images"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-[#b5b8c8]">{newReply.length}/3000</span>
                <button
                  onClick={handleReply}
                  disabled={submitting || !newReply.trim()}
                  className="px-5 py-2 bg-[#6366f1] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (isThai ? 'กำลังส่ง...' : 'Posting...') : (isThai ? 'ส่งความคิดเห็น' : 'Reply')}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6 text-center">
              <p className="text-sm text-[#8b8fa6]">{isThai ? 'เข้าสู่ระบบเพื่อร่วมสนทนา' : 'Sign in to join the discussion'}</p>
              <a href="/login" className="inline-block mt-3 px-5 py-2 bg-[#6366f1] text-white rounded-xl text-xs font-bold hover:bg-[#4f46e5] transition-all">
                {isThai ? 'เข้าสู่ระบบ' : 'Sign In'}
              </a>
            </div>
          )
        ) : (
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6 text-center">
            <p className="text-sm text-red-400">🔒 {isThai ? 'กระทู้นี้ถูกล็อก' : 'This thread is locked'}</p>
          </div>
        )}
      </div>
    </div>
  )
}