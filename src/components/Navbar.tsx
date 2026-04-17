'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import { useT, useLocale } from '@/lib/i18n'
import { LangToggle } from '@/components/LangToggle'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const { user, isGuest, isAuthenticated, logout } = useAuth()
  const t = useT()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) { setIsAdmin(false); return }
    // Check admin role
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${user.access_token}` },
    })
      .then(r => r.json())
      .then(data => setIsAdmin(data?.[0]?.role === 'admin'))
      .catch(() => setIsAdmin(false))
  }, [user])

  useEffect(() => {
    if (!user) return
    fetch('/api/notifications', {
      headers: { 'Authorization': `Bearer ${user.access_token}` },
    })
      .then(r => r.json())
      .then(data => setUnreadCount(data.unread_count || 0))
      .catch(() => {})
  }, [user])

  const links = [
    { href: '/', labelKey: 'nav.home' as const, icon: '🏠' },
    { href: '/search', labelKey: 'nav.search' as const, icon: '🔍' },
    { href: '/sets', labelKey: 'nav.sets' as const, icon: '📂' },
    { href: '/sealed', labelKey: 'nav.sealed' as const, icon: '📦' },
    { href: '/discussions', labelKey: 'nav.discuss' as const, icon: '💬' },
    { href: '/community', labelKey: 'nav.community' as const, icon: '👥' },
    { href: '/collection', labelKey: 'nav.collection' as const, icon: '🃏' },
  ]

  return (
    <nav className="border-b border-[#e8eaf0] bg-white/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="text-2xl transition-transform group-hover:scale-110">🃏</span>
            <span className="text-xl font-bold text-[#6366f1] tracking-tight">
              TCG Vault
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-[#6366f1] bg-[#6366f1]/5'
                    : 'text-[#5c6078] hover:text-[#6366f1] hover:bg-[#6366f1]/5'
                }`}
              >
                <span className="mr-1">{link.icon}</span>
                <span className="hidden sm:inline">{t(link.labelKey)}</span>
              </Link>
            ))}
          </div>

          {/* Auth + Language */}
          <div className="flex items-center gap-3">
            <LangToggle />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {isGuest ? (
                  <Link
                    href="/login"
                    className="text-xs px-4 py-1.5 bg-[#6366f1]/10 text-[#6366f1] rounded-lg hover:bg-[#6366f1]/20 transition-colors font-semibold"
                  >
                    {t('nav.signIn')}
                  </Link>
                ) : (
                  <>
                    {/* Notifications bell */}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="p-2 rounded-lg hover:bg-[#6366f1]/5 transition-colors"
                        title="Admin Panel"
                      >
                        <span className="text-lg">🛡️</span>
                      </Link>
                    )}
                    <Link
                      href="/notifications"
                      className="relative p-2 rounded-lg hover:bg-[#6366f1]/5 transition-colors"
                    >
                      <span className="text-lg">🔔</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>

                    {/* Trades */}
                    <Link
                      href="/trades"
                      className="p-2 rounded-lg hover:bg-[#6366f1]/5 transition-colors"
                    >
                      <span className="text-lg">🤝</span>
                    </Link>

                    {/* Profile */}
                    <Link
                      href={`/u/${user?.email?.split('@')[0] || ''}`}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[#6366f1]/5 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#6366f1]/10 flex items-center justify-center text-xs font-bold text-[#6366f1]">
                        {user?.email?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-[#5c6078] hidden sm:block">{user?.email?.split('@')[0]}</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="text-xs px-3 py-1.5 bg-white text-[#5c6078] rounded-lg hover:text-[#1e2235] transition-colors border border-[#e8eaf0]"
                    >
                      {t('nav.signOut')}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm px-5 py-2 bg-[#6366f1] text-white font-semibold rounded-lg hover:bg-[#4f46e5] transition-all shadow-sm shadow-[#6366f1]/25"
              >
                {t('nav.signIn')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}