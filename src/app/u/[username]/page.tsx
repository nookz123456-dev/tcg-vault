'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/useAuth'

interface Profile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  is_public: boolean
  collection_public: boolean
  followers_count: number
  following_count: number
  collections_count: number
}

interface Badge {
  id: string
  badge_id: string
  earned_at: string
  badge_definitions: {
    name: string
    description: string
    icon: string
    category: string
  }
}

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'activity' | 'badges' | 'wishlist' | 'trades'>('activity')

  useEffect(() => {
    fetch(`/api/profiles?username=${encodeURIComponent(username)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setProfile(data)
        if (data?.id) {
          // Fetch badges
          fetch(`/api/badges/user?userId=${data.id}`)
            .then(r => r.json())
            .then(b => setBadges(b.badges || []))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [username])

  const handleFollow = async () => {
    if (!user || !profile) return
    setFollowLoading(true)
    try {
      if (isFollowing) {
        await fetch('/api/follows', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
          body: JSON.stringify({ following_id: profile.id }),
        })
        setIsFollowing(false)
        setProfile(p => p ? { ...p, followers_count: p.followers_count - 1 } : p)
      } else {
        await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
          body: JSON.stringify({ following_id: profile.id }),
        })
        setIsFollowing(true)
        setProfile(p => p ? { ...p, followers_count: p.followers_count + 1 } : p)
      }
    } catch { /* ignore */ }
    setFollowLoading(false)
  }

  const CATEGORY_LABELS: Record<string, string> = {
    collection: 'Collection',
    social: 'Social',
    trading: 'Trading',
    special: 'Special',
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="shimmer h-8 w-48 rounded-lg mb-4" />
          <div className="shimmer h-4 w-64 rounded" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4 opacity-50">🔍</div>
          <h1 className="text-2xl font-bold text-[#1e2235] mb-2">User not found</h1>
          <p className="text-[#8b8fa6]">No user with username &quot;{username}&quot;</p>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.id === profile.id

  // Group badges by category
  const badgesByCategory = badges.reduce((acc, b) => {
    const cat = b.badge_definitions?.category || 'special'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(b)
    return acc
  }, {} as Record<string, Badge[]>)

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-[#f5f6fa] border-2 border-amber-500/30 flex items-center justify-center text-3xl font-bold text-[#6366f1] flex-shrink-0 overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                profile.username?.charAt(0).toUpperCase() || '?'
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-[#1e2235]">{profile.username}</h1>
                {/* Featured badges (top 3) */}
                {badges.slice(0, 3).map(b => (
                  <span key={b.id} className="text-lg" title={b.badge_definitions?.name}>
                    {b.badge_definitions?.icon}
                  </span>
                ))}
              </div>
              {profile.bio && <p className="text-[#5c6078] mt-2 text-sm leading-relaxed">{profile.bio}</p>}

              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-[#1e2235]">{profile.collections_count}</p>
                  <p className="text-xs text-[#8b8fa6]">Collections</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[#1e2235]">{profile.followers_count}</p>
                  <p className="text-xs text-[#8b8fa6]">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[#1e2235]">{profile.following_count}</p>
                  <p className="text-xs text-[#8b8fa6]">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[#1e2235]">{badges.length}</p>
                  <p className="text-xs text-[#8b8fa6]">Badges</p>
                </div>
              </div>
            </div>

            {!isOwnProfile && user && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ${
                  isFollowing
                    ? 'bg-[#f5f6fa] border border-[#e8eaf0] text-[#5c6078] hover:text-red-400 hover:border-red-400/30'
                    : 'bg-[#6366f1] text-[#1e2235] hover:bg-[#4f46e5] shadow-sm'
                }`}
              >
                {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl p-1 mb-6">
          {(['activity', 'badges', 'wishlist', 'trades'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-[#6366f1] text-[#1e2235]'
                  : 'text-[#8b8fa6] hover:text-[#1e2235]'
              }`}
            >
              {tab === 'badges' && '🏅 '}{tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'badges' && (
          <div className="space-y-6">
            {badges.length === 0 ? (
              <div className="bg-white border border-[#e8eaf0] rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4 opacity-50">🏅</div>
                <p className="text-[#8b8fa6]">No badges earned yet</p>
                <p className="text-[#b5b8c8] text-xs mt-1">Collect cards, comment, and trade to earn badges!</p>
              </div>
            ) : (
              Object.entries(badgesByCategory).map(([category, catBadges]) => (
                <div key={category}>
                  <h3 className="text-sm font-bold text-[#6366f1] uppercase tracking-wider mb-3">
                    {CATEGORY_LABELS[category] || category}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {catBadges.map(b => (
                      <div
                        key={b.id}
                        className="bg-white border border-[#e8eaf0] rounded-xl p-4 text-center card-hover"
                      >
                        <div className="text-3xl mb-2">{b.badge_definitions?.icon}</div>
                        <p className="text-xs font-bold text-[#1e2235]">{b.badge_definitions?.name}</p>
                        <p className="text-[10px] text-[#8b8fa6] mt-1">{b.badge_definitions?.description}</p>
                        <p className="text-[9px] text-[#b5b8c8] mt-2">
                          {new Date(b.earned_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3 opacity-50">📋</div>
            <p className="text-[#5c6078] font-medium">
              {isOwnProfile ? 'Your activity will appear here' : `${profile.username}'s activity will appear here`}
            </p>
            <p className="text-[#8b8fa6] text-sm mt-1">Start collecting and trading to see your activity!</p>
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3 opacity-50">💭</div>
            <p className="text-[#5c6078] font-medium">Wishlist coming soon</p>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3 opacity-50">🤝</div>
            <p className="text-[#5c6078] font-medium">Trade history coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}