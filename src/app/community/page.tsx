'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ImageUpload from '@/components/ImageUpload'
import { useAuth } from '@/lib/useAuth'
import { useT } from '@/lib/i18n'

// ─── Types ───
interface Activity {
  id: string; user_id: string; action: string; card_id: string; game: string
  metadata: Record<string, unknown>; created_at: string
  profiles?: { username: string; display_name: string; avatar_url: string | null }
}
interface LeaderboardEntry {
  user_id: string; username: string; display_name: string; avatar_url: string | null; total_cards: number; total_value: number
}
interface TrendingCard { card_id: string; game: string; count: number }
interface Board { id: string; slug: string; name: string; description: string; icon: string; thread_count: number }
interface Thread {
  id: string; board_id: string; title: string; content: string; is_pinned: boolean
  views: number; created_at: string; image_url?: string; like_count?: number
  profiles: { username: string; avatar_url: string | null }
  discussion_boards: { name: string; slug: string; icon: string }
  reply_count: number
}

const ACTION_LABELS_TH: Record<string, string> = {
  added_to_collection: 'เพิ่มเข้าคอลเลกชัน', removed_from_collection: 'ลบออกจากคอลเลกชัน',
  added_to_wishlist: 'เพิ่มวิชลิสต์', posted_comment: 'แสดงความคิดเห็นที่',
  listed_for_trade: 'ตั้งขายแลกเปลี่ยน', followed_user: 'ติดตาม', updated_profile: 'อัปเดตโปรไฟล์',
}
const ACTION_LABELS_EN: Record<string, string> = {
  added_to_collection: 'added to collection', removed_from_collection: 'removed from collection',
  added_to_wishlist: 'added to wishlist', posted_comment: 'commented on',
  listed_for_trade: 'listed for trade', followed_user: 'followed', updated_profile: 'updated profile',
}
const GAME_COLORS: Record<string, string> = {
  pokemon: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  onepiece: 'bg-red-500/10 text-red-400 border-red-500/20',
  'pokemon-jp': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
}
const GAME_LABELS: Record<string, string> = { pokemon: 'Pokemon', onepiece: 'One Piece', 'pokemon-jp': 'Pokemon JP' }

type Tab = 'feed' | 'discussions' | 'leaderboard'

export default function CommunityPage() {
  const { user } = useAuth()
  const t = useT()
  const [tab, setTab] = useState<Tab>('feed')

  // Feed data
  const [activities, setActivities] = useState<Activity[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  // Discussions data
  const [boards, setBoards] = useState<Board[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null)

  // New thread form
  const [showNewThread, setShowNewThread] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newImage, setNewImage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [loading, setLoading] = useState(true)

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // Fetch boards on mount
  useEffect(() => {
    fetch('/api/discussions/boards').then(r => r.json()).then(data => setBoards(data.boards || []))
  }, [])

  useEffect(() => {
    if (tab === 'feed') fetchActivities()
    else if (tab === 'leaderboard') fetchLeaderboard()
    else if (tab === 'discussions') fetchThreads()
  }, [tab])

  useEffect(() => {
    if (tab === 'discussions') fetchThreads()
  }, [selectedBoard])

  async function fetchActivities() {
    setLoading(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/activities?select=*,profiles(username,display_name,avatar_url)&order=created_at.desc&limit=30`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      })
      if (res.ok) { const data = await res.json(); setActivities(data || []) }
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function fetchLeaderboard() {
    setLoading(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,username,display_name,avatar_url,is_public,collection_public&is_public=eq.true&order=username&limit=20`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      })
      if (res.ok) {
        const data = await res.json()
        const entries = await Promise.all((data || []).map(async (p: any) => {
          const cRes = await fetch(`${SUPABASE_URL}/rest/v1/collections?select=id&user_id=eq.${p.id}`, { headers: { 'apikey': SUPABASE_ANON_KEY } })
          const cards = cRes.ok ? await cRes.json() : []
          return { ...p, total_cards: cards.length, total_value: 0 }
        }))
        setLeaderboard(entries.filter((e: any) => e.total_cards > 0).sort((a: any, b: any) => b.total_cards - a.total_cards))
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function fetchThreads() {
    setLoading(true)
    const url = selectedBoard ? `/api/discussions/threads?boardId=${selectedBoard}` : '/api/discussions/threads'
    try {
      const res = await fetch(url)
      if (res.ok) { const data = await res.json(); setThreads(data.threads || []) }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleNewThread = async () => {
    if (!user || !newTitle.trim() || !newContent.trim() || !selectedBoard) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/discussions/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
        body: JSON.stringify({ board_id: selectedBoard, title: newTitle.trim(), content: newContent.trim(), image_url: newImage || undefined }),
      })
      if (res.ok) {
        setNewTitle(''); setNewContent(''); setNewImage(''); setShowNewThread(false)
        fetchThreads()
      }
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (seconds < 60) return t('common.ago') === 'ที่แล้ว' ? 'เมื่อสักครู่' : 'just now'
    const mins = Math.floor(seconds / 60)
    if (mins < 60) return `${mins}m ${t('common.ago')}`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ${t('common.ago')}`
    const days = Math.floor(hours / 24)
    return `${days}d ${t('common.ago')}`
  }

  function getActionLabel(action: string): string {
    const isTh = t('common.ago') === 'ที่แล้ว'
    return isTh ? (ACTION_LABELS_TH[action] || action) : (ACTION_LABELS_EN[action] || action)
  }

  function getCardLink(cardId: string, game: string): string {
    if (game === 'pokemon') return `/card/pokemon/${cardId}`
    if (game === 'onepiece') return `/card/onepiece/${encodeURIComponent(cardId)}`
    if (game === 'pokemon-jp') return `/card/pokemon-jp/${encodeURIComponent(cardId)}`
    return '#'
  }

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'feed', icon: '📡', label: t('community.feed') },
    { key: 'discussions', icon: '💬', label: t('community.discussions') },
    { key: 'leaderboard', icon: '🏆', label: t('community.leaderboardTab') },
  ]

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e2235] tracking-tight mb-2">{t('nav.community')}</h1>
          <p className="text-[#5c6078]">{t('community.joinDesc')}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
          {tabs.map(tb => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                tab === tb.key
                  ? 'bg-[#6366f1] text-white shadow-sm shadow-[#6366f1]/20'
                  : 'bg-white border border-[#e8eaf0] text-[#5c6078] hover:text-[#1e2235] hover:border-[#6366f1]/20'
              }`}
            >
              <span>{tb.icon}</span>
              <span>{tb.label}</span>
            </button>
          ))}
        </div>

        {/* ─── Feed Tab ─── */}
        {tab === 'feed' && (
          loading ? (
            <div className="text-center py-12"><div className="text-4xl animate-pulse">⏳</div></div>
          ) : activities.length === 0 ? (
            <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">📡</div>
              <p className="text-[#5c6078] text-lg mb-2">{t('community.noActivity')}</p>
              <p className="text-[#8b8fa6] text-sm mb-6">{t('community.noActivityDesc')}</p>
              <Link href="/search" className="inline-block px-6 py-3 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5]">{t('common.searchCards')}</Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activities.map(a => (
                <div key={a.id} className="bg-white border border-[#e8eaf0] rounded-xl p-3.5 flex items-start gap-3 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all">
                  <div className="w-9 h-9 bg-[#fafbfc] border border-[#e8eaf0] rounded-full flex items-center justify-center text-base flex-shrink-0 overflow-hidden">
                    {a.profiles?.avatar_url ? <img src={a.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#1e2235]">{a.profiles?.display_name || a.profiles?.username || 'Collector'}</span>
                      <span className="text-xs text-[#8b8fa6]">{getActionLabel(a.action)}</span>
                      {a.card_id && a.game && (
                        <Link href={getCardLink(a.card_id, a.game)} className="text-xs text-[#6366f1] hover:underline">
                          {(a.metadata as any)?.card_name || a.card_id.slice(0, 20)}
                        </Link>
                      )}
                      {a.game && <span className={`text-[10px] px-1.5 py-0.5 rounded border ${GAME_COLORS[a.game] || ''}`}>{GAME_LABELS[a.game] || a.game}</span>}
                    </div>
                    <p className="text-xs text-[#b5b8c8] mt-0.5">{timeAgo(a.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ─── Discussions Tab ─── */}
        {tab === 'discussions' && (
          <div>
            {/* Action row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
                <button
                  onClick={() => setSelectedBoard(null)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!selectedBoard ? 'bg-[#6366f1] text-white' : 'bg-white border border-[#e8eaf0] text-[#5c6078]'}`}
                >
                  {t('discuss.allThreads')}
                </button>
                {boards.map(board => (
                  <button
                    key={board.id}
                    onClick={() => setSelectedBoard(board.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedBoard === board.id ? 'bg-[#6366f1] text-white' : 'bg-white border border-[#e8eaf0] text-[#5c6078]'}`}
                  >
                    {board.icon} {board.name}
                  </button>
                ))}
              </div>
              {user ? (
                <button onClick={() => setShowNewThread(!showNewThread)} className="ml-2 flex-shrink-0 px-4 py-1.5 bg-[#6366f1] text-white font-bold rounded-xl text-xs hover:bg-[#4f46e5] transition-all">
                  + {t('discuss.newThread')}
                </button>
              ) : (
                <Link href="/login" className="ml-2 flex-shrink-0 px-4 py-1.5 bg-[#6366f1] text-white font-bold rounded-xl text-xs hover:bg-[#4f46e5]">{t('common.signIn')}</Link>
              )}
            </div>

            {/* New Thread Form */}
            {showNewThread && (
              <div className="bg-white border border-[#6366f1]/30 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-bold text-[#1e2235] mb-3">{t('discuss.newThread')}</h3>
                <div className="mb-3">
                  <label className="text-xs font-semibold text-[#5c6078] mb-1.5 block">{t('discuss.selectBoard')}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {boards.map(board => (
                      <button key={board.id} onClick={() => setSelectedBoard(board.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedBoard === board.id ? 'bg-[#6366f1] text-white' : 'bg-[#fafbfc] text-[#5c6078] border border-[#e8eaf0]'}`}>
                        {board.icon} {board.name}
                      </button>
                    ))}
                  </div>
                  {!selectedBoard && <p className="text-xs text-red-400 mt-1">{t('discuss.selectBoardHint')}</p>}
                </div>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={t('discuss.threadTitle')} maxLength={200}
                  className="w-full px-3 py-2 bg-[#fafbfc] border border-[#e8eaf0] rounded-lg text-sm text-[#1e2235] placeholder:text-[#b5b8c8] focus:outline-none focus:border-[#6366f1]/50 mb-2" />
                <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder={t('discuss.threadContent')} maxLength={5000} rows={3}
                  className="w-full px-3 py-2 bg-[#fafbfc] border border-[#e8eaf0] rounded-lg text-sm text-[#1e2235] placeholder:text-[#b5b8c8] focus:outline-none focus:border-[#6366f1]/50 resize-none" />
                <ImageUpload value={newImage} onChange={url => setNewImage(url)} label={t('discuss.attachImage')} folder="discussion-images" />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[10px] text-[#b5b8c8]">{newContent.length}/5000</span>
                  <div className="flex gap-2">
                    <button onClick={() => setShowNewThread(false)} className="px-3 py-1.5 text-xs text-[#8b8fa6]">{t('common.cancel')}</button>
                    <button onClick={handleNewThread} disabled={submitting || !newTitle.trim() || !newContent.trim() || !selectedBoard}
                      className="px-4 py-1.5 bg-[#6366f1] text-white rounded-lg text-xs font-bold hover:bg-[#4f46e5] disabled:opacity-40 transition-all">
                      {submitting ? t('discuss.posting') : t('discuss.postThread')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Thread List */}
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="animate-pulse h-16 rounded-xl bg-white" />)}</div>
            ) : threads.length === 0 ? (
              <div className="bg-white border border-[#e8eaf0] rounded-xl p-10 text-center">
                <div className="text-4xl mb-3 opacity-50">💬</div>
                <p className="text-[#1e2235] font-bold mb-1">{t('discuss.noThreads')}</p>
                <p className="text-[#8b8fa6] text-sm">{user ? t('discuss.startConv') : t('discuss.signInToPost')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {threads.sort((a, b) => { if (a.is_pinned && !b.is_pinned) return -1; if (!a.is_pinned && b.is_pinned) return 1; return 0 }).map(thread => (
                  <Link key={thread.id} href={`/discussions/${thread.id}`} className="block bg-white border border-[#e8eaf0] rounded-xl p-3.5 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all group">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#6366f1]/15 flex items-center justify-center text-xs font-bold text-[#6366f1] flex-shrink-0 overflow-hidden">
                        {thread.profiles?.avatar_url ? <img src={thread.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : thread.profiles?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {thread.is_pinned && <span className="text-[10px] text-[#6366f1]">📌</span>}
                          <h3 className="text-sm font-bold text-[#1e2235] group-hover:text-[#6366f1] transition-colors truncate">{thread.title}</h3>
                        </div>
                        <p className="text-xs text-[#8b8fa6] line-clamp-1">{thread.content}</p>
                        {thread.image_url && <img src={thread.image_url} alt="" className="mt-1.5 h-16 w-16 object-cover rounded-lg border border-[#e8eaf0]" />}
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#b5b8c8]">
                          <span className="font-semibold text-[#5c6078]">{thread.profiles?.username || '?'}</span>
                          <span>{thread.discussion_boards?.icon} {thread.discussion_boards?.name}</span>
                          <span>{timeAgo(thread.created_at)}</span>
                          <span>👁 {thread.views}</span>
                          <span>💬 {thread.reply_count}</span>
                          {thread.like_count !== undefined && thread.like_count > 0 && <span>❤️ {thread.like_count}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Leaderboard Tab ─── */}
        {tab === 'leaderboard' && (
          loading ? (
            <div className="text-center py-12"><div className="text-4xl animate-pulse">⏳</div></div>
          ) : leaderboard.length === 0 ? (
            <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">🏆</div>
              <p className="text-[#5c6078] text-lg mb-2">{t('community.noLeaders')}</p>
              <p className="text-[#8b8fa6] text-sm mb-6">{t('community.noLeadersDesc')}</p>
              <Link href="/me" className="inline-block px-6 py-3 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5]">{t('home.hero.cta')}</Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {leaderboard.map((entry, i) => (
                <Link key={entry.user_id} href={`/u/${entry.username}`} className="bg-white border border-[#e8eaf0] rounded-xl p-3.5 flex items-center gap-3 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 0 ? 'bg-amber-500/20 text-amber-500 border-2 border-amber-500' :
                    i === 1 ? 'bg-gray-400/15 text-[#5c6078] border border-[#e8eaf0]' :
                    i === 2 ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                    'bg-[#fafbfc] text-[#8b8fa6] border border-[#e8eaf0]'
                  }`}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#1e2235] truncate">{entry.display_name || entry.username || 'Collector'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#6366f1]">{entry.total_cards} {t('common.cards')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* CTA */}
        <div className="mt-10 text-center">
          <div className="bg-[#f5f6fa] border border-[#e8eaf0] rounded-2xl p-8 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-[#1e2235] mb-2">{t('community.joinCta')}</h3>
            <p className="text-[#8b8fa6] text-sm mb-5">{t('community.joinDesc')}</p>
            <Link href="/login" className="inline-block px-6 py-2.5 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] text-sm">{t('community.getStarted')}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}