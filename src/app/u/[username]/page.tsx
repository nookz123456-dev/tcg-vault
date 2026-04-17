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

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/profiles?username=${encodeURIComponent(username)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setProfile(data)
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
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">User not found</h1>
          <p className="text-[var(--warm-400)]">No user with username &quot;{username}&quot;</p>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.id === profile.id

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-[var(--surface-1)] border-2 border-amber-500/30 flex items-center justify-center text-3xl font-bold text-amber-400 flex-shrink-0 overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                profile.username?.charAt(0).toUpperCase() || '?'
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-[var(--foreground)]">{profile.username}</h1>
              {profile.bio && <p className="text-[var(--warm-300)] mt-2 text-sm leading-relaxed">{profile.bio}</p>}

              {/* Stats */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-[var(--foreground)]">{profile.collections_count}</p>
                  <p className="text-xs text-[var(--warm-400)]">Collections</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[var(--foreground)]">{profile.followers_count}</p>
                  <p className="text-xs text-[var(--warm-400)]">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[var(--foreground)]">{profile.following_count}</p>
                  <p className="text-xs text-[var(--warm-400)]">Following</p>
                </div>
              </div>
            </div>

            {/* Follow / Edit button */}
            {!isOwnProfile && user && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-5 py-2 rounded-xl font-semibold text-sm transition-all ${
                  isFollowing
                    ? 'bg-[var(--surface-1)] border border-[var(--card-border)] text-[var(--warm-300)] hover:text-red-400 hover:border-red-400/30'
                    : 'bg-amber-500 text-[var(--warm-900)] hover:bg-amber-400 shadow-sm'
                }`}
              >
                {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--surface-1)] border border-[var(--card-border)] rounded-xl p-1 mb-6">
          <button className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-amber-500 text-[var(--warm-900)]">Activity</button>
          <button className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg text-[var(--warm-400)] hover:text-[var(--foreground)] transition-colors">Wishlist</button>
          <button className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg text-[var(--warm-400)] hover:text-[var(--foreground)] transition-colors">Trades</button>
        </div>

        {/* Activity placeholder */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3 opacity-50">📋</div>
          <p className="text-[var(--warm-300)] font-medium">
            {isOwnProfile ? 'Your activity will appear here' : `${profile.username}'s activity will appear here`}
          </p>
          <p className="text-[var(--warm-400)] text-sm mt-1">Start collecting and trading to see your activity!</p>
        </div>
      </div>
    </div>
  )
}