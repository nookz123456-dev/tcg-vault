'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/useAuth'
import { useT } from '@/lib/i18n'

interface Stats {
  totalUsers: number
  totalThreads: number
  totalComments: number
  totalActivities: number
  totalTrades: number
}

interface User {
  id: string
  username: string
  display_name: string
  role: string
  created_at: string
}

interface SellerApp {
  id: string
  real_name: string
  status: string
  shop_name: string | null
  created_at: string
  profiles: { id: string; username: string; display_name: string }[]
}

interface Thread {
  id: string
  title: string
  is_pinned: boolean
  created_at: string
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/15 text-red-400 border border-red-500/30',
  moderator: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  user: 'bg-[#6366f1]/15 text-[#6366f1] border border-[#6366f1]/30',
}

export default function AdminPage() {
  const { user } = useAuth()
  const t = useT()
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [recentThreads, setRecentThreads] = useState<Thread[]>([])
  const [sellerApps, setSellerApps] = useState<SellerApp[]>([])
  const [tab, setTab] = useState<'overview' | 'users' | 'threads' | 'sellers'>('overview')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetch('/api/admin', {
      headers: { 'Authorization': `Bearer ${user.access_token}` },
    })
      .then(r => {
        if (r.status === 403) { setIsAuthorized(false); setLoading(false); return null }
        if (!r.ok) { setLoading(false); return null }
        setIsAuthorized(true)
        return r.json()
      })
      .then(data => {
        if (data) {
          setStats(data.stats)
          setRecentUsers(data.recentUsers || [])
          setRecentThreads(data.recentThreads || [])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (tab === 'sellers' && user) {
      fetch('/api/seller?action=pending', {
        headers: { 'Authorization': `Bearer ${user.access_token}` },
      })
        .then(r => r.json())
        .then(data => setSellerApps(data.sellers || []))
        .catch(() => {})
    }
  }, [tab, user])

  const updateRole = async (userId: string, role: string) => {
    if (!user) return
    setActionLoading(true)
    try {
      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
        body: JSON.stringify({ action: 'updateRole', userId, role }),
      })
      setRecentUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  const togglePin = async (threadId: string) => {
    if (!user) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
        body: JSON.stringify({ action: 'togglePin', threadId }),
      })
      const data = await res.json()
      if (data.success) {
        setRecentThreads(prev => prev.map(th => th.id === threadId ? { ...th, is_pinned: data.thread?.is_pinned ?? !th.is_pinned } : th))
      }
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  const deleteThread = async (threadId: string) => {
    if (!user || !confirm('Delete this thread and all replies?')) return
    setActionLoading(true)
    try {
      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
        body: JSON.stringify({ action: 'deleteThread', threadId }),
      })
      setRecentThreads(prev => prev.filter(th => th.id !== threadId))
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  const handleSellerAction = async (sellerId: string, action: 'approve' | 'reject', reason?: string) => {
    if (!user) return
    setActionLoading(true)
    try {
      await fetch('/api/seller', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
        body: JSON.stringify({ sellerId, action, rejectionReason: reason }),
      })
      setSellerApps(prev => prev.filter(s => s.id !== sellerId))
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-[#8b8fa6]">Please sign in to access admin panel</p>
          <a href="/login" className="inline-block mt-3 px-5 py-2 bg-[#6366f1] text-[#1e2235] rounded-xl text-sm font-bold hover:bg-[#4f46e5]">Sign In</a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="shimmer h-8 w-48 rounded-lg mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <div key={i} className="shimmer h-24 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-[#1e2235] mb-2">Access Denied</h2>
          <p className="text-[#8b8fa6]">You need admin privileges to access this page.</p>
          <a href="/community" className="inline-block mt-4 px-5 py-2 bg-[#6366f1] text-[#1e2235] rounded-xl text-sm font-bold hover:bg-[#4f46e5]">Back to Community</a>
        </div>
      </div>
    )
  }

  const isThai = t('common.ago') === 'ที่แล้ว'

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1e2235]">
              🛡️ Admin Panel
            </h1>
            <p className="text-sm text-[#8b8fa6] mt-1">
              {isThai ? 'จัดการผู้ใช้ กระทู้ และเนื้อหา' : 'Manage users, threads, and content'}
            </p>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            ADMIN
          </span>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            <div className="bg-white border border-[#e8eaf0] rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-[#6366f1]">{stats.totalUsers}</p>
              <p className="text-xs text-[#8b8fa6] mt-1">{isThai ? 'ผู้ใช้' : 'Users'}</p>
            </div>
            <div className="bg-white border border-[#e8eaf0] rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-[#6366f1]">{stats.totalThreads}</p>
              <p className="text-xs text-[#8b8fa6] mt-1">{isThai ? 'กระทู้' : 'Threads'}</p>
            </div>
            <div className="bg-white border border-[#e8eaf0] rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-[#6366f1]">{stats.totalComments}</p>
              <p className="text-xs text-[#8b8fa6] mt-1">{isThai ? 'ความคิดเห็น' : 'Comments'}</p>
            </div>
            <div className="bg-white border border-[#e8eaf0] rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-[#6366f1]">{stats.totalActivities}</p>
              <p className="text-xs text-[#8b8fa6] mt-1">{isThai ? 'กิจกรรม' : 'Activities'}</p>
            </div>
            <div className="bg-white border border-[#e8eaf0] rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-[#6366f1]">{stats.totalTrades}</p>
              <p className="text-xs text-[#8b8fa6] mt-1">{isThai ? 'แลกเปลี่ยน' : 'Trades'}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl p-1 mb-6">
          {(['overview', 'users', 'threads', 'sellers'] as const).map(tb => {
            const label = tb === 'overview' ? (isThai ? 'ภาพรวม' : 'Overview')
              : tb === 'users' ? (isThai ? 'ผู้ใช้' : 'Users')
              : tb === 'threads' ? (isThai ? 'กระทู้' : 'Threads')
              : (isThai ? 'ผู้ขาย' : 'Sellers')
            return (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  tab === tb ? 'bg-[#6366f1] text-[#1e2235]' : 'text-[#5c6078] hover:text-[#1e2235]'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#1e2235] mb-3">
                {isThai ? 'ผู้ใช้ล่าสุด' : 'Recent Users'}
              </h2>
              <div className="space-y-2">
                {recentUsers.slice(0, 5).map(u => (
                  <div key={u.id} className="bg-white border border-[#e8eaf0] rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#6366f1]/20 flex items-center justify-center text-sm font-bold text-[#6366f1]">
                        {(u.display_name || u.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1e2235]">{u.display_name || u.username || 'Unknown'}</p>
                        <p className="text-xs text-[#8b8fa6]">{u.username}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1e2235] mb-3">
                {isThai ? 'กระทู้ล่าสุด' : 'Recent Threads'}
              </h2>
              <div className="space-y-2">
                {recentThreads.slice(0, 5).map(th => (
                  <div key={th.id} className="bg-white border border-[#e8eaf0] rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {th.is_pinned && <span className="text-xs text-[#6366f1]">📌</span>}
                      <p className="text-sm text-[#1e2235] truncate max-w-xs">{th.title}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => togglePin(th.id)}
                        className="px-2 py-1 text-xs rounded-lg bg-[#f5f6fa] text-[#5c6078] hover:text-[#6366f1] transition-colors"
                        disabled={actionLoading}
                      >
                        {th.is_pinned ? '📌 Unpin' : '📌 Pin'}
                      </button>
                      <button
                        onClick={() => deleteThread(th.id)}
                        className="px-2 py-1 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        disabled={actionLoading}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="space-y-2">
            {recentUsers.map(u => (
              <div key={u.id} className="bg-white border border-[#e8eaf0] rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6366f1]/20 flex items-center justify-center text-sm font-bold text-[#6366f1]">
                    {(u.display_name || u.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1e2235]">{u.display_name || u.username || 'Unknown'}</p>
                    <p className="text-xs text-[#8b8fa6]">@{u.username} · {u.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={u.role}
                    onChange={e => updateRole(u.id, e.target.value)}
                    disabled={actionLoading}
                    className="text-xs px-2 py-1.5 rounded-lg border border-[#e8eaf0] bg-[#f5f6fa] text-[#1e2235] focus:outline-none focus:border-[#6366f1]/50"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Threads */}
        {tab === 'threads' && (
          <div className="space-y-2">
            {recentThreads.map(th => (
              <div key={th.id} className="bg-white border border-[#e8eaf0] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {th.is_pinned && <span className="text-xs text-[#6366f1] font-semibold">📌 Pinned</span>}
                    <h3 className="text-sm font-semibold text-[#1e2235] truncate">{th.title}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => togglePin(th.id)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-[#6366f1]/10 text-[#6366f1] hover:bg-[#6366f1]/20 transition-colors font-semibold"
                      disabled={actionLoading}
                    >
                      {th.is_pinned ? (isThai ? 'ยกเลิกปักหมุด' : 'Unpin') : (isThai ? 'ปักหมุด' : 'Pin')}
                    </button>
                    <button
                      onClick={() => deleteThread(th.id)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-semibold"
                      disabled={actionLoading}
                    >
                      {isThai ? 'ลบ' : 'Delete'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#8b8fa6]">ID: {th.id.slice(0, 12)}... · {new Date(th.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* Sellers */}
        {tab === 'sellers' && (
          <div className="space-y-2">
            {sellerApps.length === 0 ? (
              <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4 opacity-50">🏪</div>
                <h3 className="text-lg font-bold text-[#1e2235] mb-2">{isThai ? 'ไม่มีคำขอรอตรวจสอบ' : 'No pending applications'}</h3>
                <p className="text-[#8b8fa6] text-sm">{isThai ? 'ทุกคำขอได้รับการตรวจสอบแล้ว' : 'All applications have been reviewed'}</p>
              </div>
            ) : sellerApps.map(app => (
              <div key={app.id} className="bg-white border border-[#e8eaf0] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1e2235]">{app.real_name}</h3>
                    <p className="text-xs text-[#8b8fa6]">@{app.profiles?.[0]?.username || 'Unknown'}{app.shop_name ? ` · ${app.shop_name}` : ''}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    {isThai ? 'รอตรวจสอบ' : 'Pending'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSellerAction(app.id, 'approve')}
                    className="px-4 py-2 text-xs rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors font-semibold"
                    disabled={actionLoading}
                  >
                    ✅ {isThai ? 'อนุมัติ' : 'Approve'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt(isThai ? 'เหตุผลที่ปฏิเสธ:' : 'Rejection reason:')
                      if (reason) handleSellerAction(app.id, 'reject', reason)
                    }}
                    className="px-4 py-2 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-semibold"
                    disabled={actionLoading}
                  >
                    ❌ {isThai ? 'ปฏิเสธ' : 'Reject'}
                  </button>
                </div>
                <p className="text-[10px] text-[#b5b8c8] mt-2">{app.id.slice(0, 12)}... · {new Date(app.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}