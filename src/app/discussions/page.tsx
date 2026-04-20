'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ImageUpload from '@/components/ImageUpload'
import { useAuth } from '@/lib/useAuth'
import { useT, useLocale } from '@/lib/i18n'

interface Board {
 id: string
 slug: string
 name: string
 description: string
 icon: string
 thread_count: number
}

interface Thread {
 id: string
 board_id: string
 title: string
 content: string
 is_pinned: boolean
 views: number
 created_at: string
 profiles: { username: string; avatar_url: string | null }
 discussion_boards: { name: string; slug: string; icon: string }
 reply_count: number
 image_url?: string
 like_count?: number
}

export default function DiscussionsPage() {
 const { user } = useAuth()
 const t = useT()
 const { locale } = useLocale()
 const [boards, setBoards] = useState<Board[]>([])
 const [threads, setThreads] = useState<Thread[]>([])
 const [selectedBoard, setSelectedBoard] = useState<string | null>(null)
 const [loading, setLoading] = useState(true)
 const [showNewThread, setShowNewThread] = useState(false)
 const [newTitle, setNewTitle] = useState('')
 const [newContent, setNewContent] = useState('')
 const [newImage, setNewImage] = useState('')
 const [submitting, setSubmitting] = useState(false)

 useEffect(() => {
 fetch('/api/discussions/boards').then(r => r.json()).then(data => {
 setBoards(data.boards || [])
 })
 }, [])

 useEffect(() => {
 setLoading(true)
 const url = selectedBoard
 ? `/api/discussions/threads?boardId=${selectedBoard}`
 : '/api/discussions/threads'
 fetch(url).then(r => r.json()).then(data => {
 setThreads(data.threads || [])
 setLoading(false)
 })
 }, [selectedBoard])

 const handleNewThread = async () => {
 if (!user || !newTitle.trim() || !newContent.trim() || !selectedBoard) return
 setSubmitting(true)
 try {
 const res = await fetch('/api/discussions/threads', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${user.access_token}`,
 },
 body: JSON.stringify({
 board_id: selectedBoard,
 title: newTitle.trim(),
 content: newContent.trim(),
 image_url: newImage || undefined,
 }),
 })
 if (res.ok) {
 setNewTitle('')
 setNewContent('')
 setNewImage('')
 setShowNewThread(false)
 const data = await fetch(`/api/discussions/threads?boardId=${selectedBoard}`).then(r => r.json())
 setThreads(data.threads || [])
 }
 } catch { /* ignore */ }
 setSubmitting(false)
 }

 const timeAgo = (dateStr: string) => {
 const diff = Date.now() - new Date(dateStr).getTime()
 const mins = Math.floor(diff / 60000)
 if (mins < 60) return `${mins}m ${t('common.ago')}`
 const hours = Math.floor(mins / 60)
 if (hours < 24) return `${hours}h ${t('common.ago')}`
 const days = Math.floor(hours / 24)
 return `${days}d ${t('common.ago')}`
 }

 return (
 <div className="min-h-screen" style={{ background: 'var(--background)' }}>
 <Navbar />
 <div className="max-w-5xl mx-auto px-4 py-8">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-2xl font-extrabold text-[#1e2235]">{t('discuss.title')}</h1>
 <p className="text-sm text-[#8b8fa6] mt-1">{t('discuss.subtitle')}</p>
 </div>
 {user ? (
 <button
 onClick={() => setShowNewThread(true)}
 className="px-5 py-2.5 bg-[#6366f1] text-[#1e2235] font-bold rounded-xl hover:bg-[#4f46e5] transition-all text-sm"
 >
 {t('discuss.newThread')}
 </button>
 ) : (
 <a
 href="/login"
 className="px-5 py-2.5 bg-[#6366f1] text-[#1e2235] font-bold rounded-xl hover:bg-[#4f46e5] transition-all text-sm"
 >
 {t('common.signIn')}
 </a>
 )}
 </div>

 <div className="flex gap-6">
 {/* Board Sidebar */}
 <div className="w-56 flex-shrink-0 hidden md:block">
 <div className="bg-white border border-[#e8eaf0] rounded-2xl p-2 sticky top-24">
 <button
 onClick={() => setSelectedBoard(null)}
 className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
 !selectedBoard ? 'bg-[#6366f1]/15 text-[#6366f1]' : 'text-[#5c6078] hover:text-[#1e2235] hover:bg-[#e8eaf0]'
 }`}
 >
 {t('discuss.allThreads')}
 </button>
 {boards.map(board => (
 <button
 key={board.id}
 onClick={() => setSelectedBoard(board.id)}
 className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
 selectedBoard === board.id ? 'bg-[#6366f1]/15 text-[#6366f1]' : 'text-[#5c6078] hover:text-[#1e2235] hover:bg-[#e8eaf0]'
 }`}
 >
 <span>{board.icon}</span>
 <span className="flex-1 truncate">{board.name}</span>
 {board.thread_count > 0 && (
 <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#e8eaf0] text-[#8b8fa6]">{board.thread_count}</span>
 )}
 </button>
 ))}
 </div>
 </div>

 {/* Thread List */}
 <div className="flex-1 min-w-0">
 {/* Mobile board selector */}
 <div className="md:hidden flex gap-1.5 overflow-x-auto pb-4 -mx-1 px-1">
 <button
 onClick={() => setSelectedBoard(null)}
 className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
 !selectedBoard ? 'bg-[#6366f1] text-[#1e2235]' : 'bg-[#fafbfc] text-[#5c6078] border border-[#e8eaf0]'
 }`}
 >
 All
 </button>
 {boards.map(board => {
 const label = board.icon + ' ' + board.name
 return (
 <button
 key={board.id}
 onClick={() => setSelectedBoard(board.id)}
 className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
 selectedBoard === board.id ? 'bg-[#6366f1] text-[#1e2235]' : 'bg-[#fafbfc] text-[#5c6078] border border-[#e8eaf0]'
 }`}
 >
 {label}
 </button>
 )
 })}
 </div>

 {/* New Thread Form */}
 {showNewThread && (
 <div className="bg-white border border-[#6366f1]/30 rounded-2xl p-5 mb-4">
 <h3 className="text-lg font-bold text-[#1e2235] mb-3">{t('discuss.newThread')}</h3>
 {/* Board selector */}
 <div className="mb-3">
 <label className="text-xs font-semibold text-[#5c6078] mb-1.5 block">{t('discuss.selectBoard') || 'Board'}</label>
 <div className="flex flex-wrap gap-1.5">
 {boards.map(board => {
 const label = board.icon + ' ' + board.name
 return (
 <button
 key={board.id}
 onClick={() => setSelectedBoard(board.id)}
 className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
 selectedBoard === board.id
 ? 'bg-[#6366f1] text-[#1e2235]'
 : 'bg-[#fafbfc] text-[#5c6078] border border-[#e8eaf0] hover:text-[#1e2235]'
 }`}
 >
 {label}
 </button>
 )
 })}
 </div>
 {!selectedBoard && (
 <p className="text-xs text-red-400 mt-1">{t('discuss.selectBoardHint') || 'Please select a board'}</p>
 )}
 </div>
 <input
 value={newTitle}
 onChange={e => setNewTitle(e.target.value)}
 placeholder={t('discuss.threadTitle')}
 maxLength={200}
 className="w-full px-4 py-2.5 bg-[#fafbfc] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder:text-[#b5b8c8] focus:outline-none focus:border-[#6366f1]/50 text-sm mb-3"
 />
 <textarea
 value={newContent}
 onChange={e => setNewContent(e.target.value)}
 placeholder={t('discuss.threadContent')}
 maxLength={5000}
 rows={4}
 className="w-full px-4 py-2.5 bg-[#fafbfc] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder:text-[#b5b8c8] focus:outline-none focus:border-[#6366f1]/50 resize-none text-sm"
 />
 <ImageUpload
 value={newImage}
 onChange={url => setNewImage(url)}
 label={t('discuss.attachImage')}
 folder="discussion-images"
 />
 <div className="flex justify-between items-center mt-3">
 <span className="text-xs text-[#b5b8c8]">{newContent.length}/5000</span>
 <div className="flex gap-2">
 <button
 onClick={() => setShowNewThread(false)}
 className="px-4 py-2 text-xs font-semibold text-[#8b8fa6] hover:text-[#1e2235] transition-colors"
 >
 {t('common.cancel')}
 </button>
 <button
 onClick={handleNewThread}
 disabled={submitting || !newTitle.trim() || !newContent.trim() || !selectedBoard}
 className="px-5 py-2 bg-[#6366f1] text-[#1e2235] rounded-lg text-xs font-bold hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
 >
 {submitting ? t('discuss.posting') : t('discuss.postThread')}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Threads */}
 {loading ? (
 <div className="space-y-3">
 {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-20 rounded-2xl" />)}
 </div>
 ) : threads.length === 0 ? (
 <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
 <div className="text-5xl mb-4 opacity-50">💬</div>
 <h3 className="text-lg font-bold text-[#1e2235] mb-2">{t('discuss.noThreads')}</h3>
 <p className="text-[#8b8fa6] text-sm">
 {user ? t('discuss.startConv') : t('discuss.signInToPost')}
 </p>
 </div>
 ) : (
 <div className="space-y-2">
 {threads
 .sort((a, b) => {
 if (a.is_pinned && !b.is_pinned) return -1
 if (!a.is_pinned && b.is_pinned) return 1
 return 0
 })
 .map(thread => (
 <Link
 key={thread.id}
 href={`/discussions/${thread.id}`}
 className="block bg-white border border-[#e8eaf0] rounded-2xl p-4 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all group"
 >
 <div className="flex items-start gap-3">
 <div className="w-9 h-9 rounded-full bg-[#6366f1]/20 flex items-center justify-center text-sm font-bold text-[#6366f1] flex-shrink-0 overflow-hidden">
 {thread.profiles?.avatar_url ? (
 <img src={thread.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
 ) : (
 thread.profiles?.username?.charAt(0).toUpperCase() || '?'
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 {thread.is_pinned && <span className="text-xs text-[#6366f1]">📌 {t('discuss.pinned')}</span>}
 <h3 className="text-sm font-bold text-[#1e2235] group-hover:text-[#6366f1] transition-colors truncate">
 {thread.title}
 </h3>
 </div>
 <p className="text-xs text-[#8b8fa6] line-clamp-1">{thread.content}</p>
 {thread.image_url && (
 <div className="mt-2">
 <img src={thread.image_url} alt="" className="h-20 w-20 object-cover rounded-lg border border-[#e8eaf0]" />
 </div>
 )}
 <div className="flex items-center gap-3 mt-2 text-[10px] text-[#b5b8c8]">
 <span className="font-semibold text-[#5c6078]">{thread.profiles?.username || 'Unknown'}</span>
 <span>{thread.discussion_boards?.icon} {thread.discussion_boards?.name}</span>
 <span>{timeAgo(thread.created_at)}</span>
 <span>👁 {thread.views}</span>
 <span>💬 {thread.reply_count} {t('discuss.replies')}</span>
 {thread.like_count !== undefined && thread.like_count > 0 && (
 <span>❤️ {thread.like_count}</span>
 )}
 </div>
 </div>
 </div>
 </Link>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 )
}