'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/useAuth'
import { useT } from '@/lib/i18n'

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
  const t = useT()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'activity' | 'badges' | 'wishlist' | 'trades'>('activity')
  const [uploading, setUploading] = useState(false)
  const [editBio, setEditBio] = useState(false)
  const [bioText, setBioText] = useState('')
  const [savingBio, setSavingBio] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchProfile = () => {
    fetch(`/api/profiles?username=${encodeURIComponent(username)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setProfile(data)
        if (data?.id) {
          fetch(`/api/badges/user?userId=${data.id}`)
            .then(r => r.json())
            .then(b => setBadges(b.badges || []))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchProfile() }, [username])

  // Check if following
  useEffect(() => {
    if (user && profile && user.id !== profile.id) {
      fetch(`/api/follows?follower_id=${user.id}&following_id=${profile.id}`, {
        headers: { 'Authorization': `Bearer ${user.access_token}` }
      })
        .then(r => r.json())
        .then(data => setIsFollowing(data.length > 0))
        .catch(() => {})
    }
  }, [user, profile])

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return
    const file = e.target.files[0]
    
    // Validate
    if (file.size > 2 * 1024 * 1024) {
      alert(t('profile.fileTooLarge') || 'File too large (max 2MB)')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert(t('profile.invalidFileType') || 'Invalid file type')
      return
    }

    setUploading(true)
    try {
      // Resize to 200x200 for avatar
      const resizedBlob = await resizeImage(file, 200, 200)
      
      const formData = new FormData()
      formData.append('file', resizedBlob, `avatar-${Date.now()}.webp`)
      formData.append('folder', 'avatars')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.access_token}` },
        body: formData,
      })

      if (!uploadRes.ok) throw new Error('Upload failed')
      const { url } = await uploadRes.json()

      // Update profile with new avatar URL
      const updateRes = await fetch('/api/profiles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({ avatar_url: url }),
      })

      if (!updateRes.ok) throw new Error('Update failed')
      const { profile: updated } = await updateRes.json()
      
      setProfile(p => p ? { ...p, avatar_url: updated?.avatar_url || url } : p)
    } catch (err) {
      console.error('Avatar upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const resizeImage = (file: File, maxW: number, maxH: number): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > maxW) { h *= maxW / w; w = maxW }
        if (h > maxH) { w *= maxH / h; h = maxH }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob(blob => resolve(blob || new Blob()), 'image/webp', 0.85)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const handleSaveBio = async () => {
    if (!user) return
    setSavingBio(true)
    try {
      const res = await fetch('/api/profiles', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({ bio: bioText }),
      })
      if (res.ok) {
        setProfile(p => p ? { ...p, bio: bioText } : p)
        setEditBio(false)
      }
    } catch { /* ignore */ }
    setSavingBio(false)
  }

  const CATEGORY_LABELS: Record<string, string> = {
    collection: t('badges.title') || 'Collection',
    social: 'Social',
    trading: t('trades.title') || 'Trading',
    special: 'Special',
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#f5f6fa' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded-lg" />
            <div className="h-4 w-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen" style={{ background: '#f5f6fa' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4 opacity-50">🔍</div>
          <h1 className="text-2xl font-bold text-[#1e2235] mb-2">{t('profile.notFound')}</h1>
          <p className="text-[#8b8fa6]">No user with username &quot;{username}&quot;</p>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.id === profile.id

  const badgesByCategory = badges.reduce((acc, b) => {
    const cat = b.badge_definitions?.category || 'special'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(b)
    return acc
  }, {} as Record<string, Badge[]>)

  return (
    <div className="min-h-screen" style={{ background: '#f5f6fa' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-6">
            {/* Avatar with upload overlay */}
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-[#f5f6fa] border-2 border-[#6366f1]/20 flex items-center justify-center text-3xl font-bold text-[#6366f1] overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                ) : (
                  profile.username?.charAt(0).toUpperCase() || '?'
                )}
              </div>
              {/* Upload overlay - only on own profile */}
              {isOwnProfile && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 w-20 h-20 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title={t('profile.changeAvatar') || 'Change avatar'}
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-[#1e2235]">{profile.username}</h1>
                {badges.slice(0, 3).map(b => (
                  <span key={b.id} className="text-lg" title={b.badge_definitions?.name}>
                    {b.badge_definitions?.icon}
                  </span>
                ))}
              </div>

              {/* Bio with edit */}
              {isOwnProfile && !editBio && (
                <div className="flex items-start gap-2 mt-2">
                  {profile.bio ? (
                    <p className="text-[#5c6078] text-sm leading-relaxed">{profile.bio}</p>
                  ) : (
                    <p className="text-[#b5b8c8] text-sm italic">{t('profile.addBio') || 'Add a bio...'}</p>
                  )}
                  <button
                    onClick={() => { setEditBio(true); setBioText(profile.bio || '') }}
                    className="text-[#b5b8c8] hover:text-[#6366f1] transition-colors flex-shrink-0"
                    title={t('common.edit') || 'Edit'}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
              {isOwnProfile && editBio && (
                <div className="mt-2">
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    maxLength={160}
                    rows={2}
                    className="w-full px-3 py-2 bg-[#f5f6fa] border border-[#e8eaf0] rounded-lg text-sm text-[#1e2235] placeholder:text-[#b5b8c8] focus:outline-none focus:border-[#6366f1]/50 resize-none"
                    placeholder={t('profile.bioPlaceholder') || 'Tell us about yourself...'}
                  />
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={handleSaveBio}
                      disabled={savingBio || !bioText.trim()}
                      className="px-4 py-1.5 bg-[#6366f1] text-white text-xs font-semibold rounded-lg hover:bg-[#4f46e5] disabled:opacity-40 transition-all"
                    >
                      {savingBio ? '...' : (t('common.save') || 'Save')}
                    </button>
                    <button
                      onClick={() => setEditBio(false)}
                      className="px-4 py-1.5 text-xs text-[#8b8fa6] hover:text-[#1e2235] transition-colors"
                    >
                      {t('common.cancel') || 'Cancel'}
                    </button>
                    <span className="text-[10px] text-[#b5b8c8] ml-auto">{bioText.length}/160</span>
                  </div>
                </div>
              )}
              {!isOwnProfile && profile.bio && (
                <p className="text-[#5c6078] mt-2 text-sm leading-relaxed">{profile.bio}</p>
              )}

              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-[#1e2235]">{profile.collections_count}</p>
                  <p className="text-xs text-[#8b8fa6]">{t('card.comments') || 'Collections'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[#1e2235]">{profile.followers_count}</p>
                  <p className="text-xs text-[#8b8fa6]">{t('profile.followers') || 'Followers'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[#1e2235]">{profile.following_count}</p>
                  <p className="text-xs text-[#8b8fa6]">{t('profile.following') || 'Following'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[#1e2235]">{badges.length}</p>
                  <p className="text-xs text-[#8b8fa6]">{t('badges.title') || 'Badges'}</p>
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
                    : 'bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-sm'
                }`}
              >
                {followLoading ? '...' : isFollowing ? (t('profile.unfollow') || 'Following') : (t('profile.follow') || 'Follow')}
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
                  ? 'bg-[#6366f1] text-white shadow-sm'
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
                <p className="text-[#8b8fa6]">{t('badges.unlock') || 'No badges earned yet'}</p>
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
                        className="bg-white border border-[#e8eaf0] rounded-xl p-4 text-center hover:shadow-md transition-shadow"
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
              {isOwnProfile ? 'กิจกรรมของคุณจะแสดงที่นี่' : `กิจกรรมของ ${profile.username} จะแสดงที่นี่`}
            </p>
            <p className="text-[#8b8fa6] text-sm mt-1">เริ่มสะสมและแลกเปลี่ยนเพื่อดูกิจกรรม!</p>
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3 opacity-50">💭</div>
            <p className="text-[#5c6078] font-medium">{t('profile.comingSoon') || 'Coming soon'}</p>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3 opacity-50">🤝</div>
            <p className="text-[#5c6078] font-medium">{t('profile.comingSoon') || 'Coming soon'}</p>
          </div>
        )}
      </div>
    </div>
  )
}