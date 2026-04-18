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
  const { locale } = useLocale()
  const isThai = locale === 'th'
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!user) { setIsAdmin(false); return }
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

  useEffect(() => { setMenuOpen(false) }, [pathname])

  const navItems = [
    { href: '/search', labelKey: 'nav.search' as const, icon: '🔍' },
    { href: '/sets', labelKey: 'nav.sets' as const, icon: '📂' },
    { href: '/sealed', labelKey: 'nav.sealed' as const, icon: '📦' },
    { href: '/community', labelKey: 'nav.community' as const, icon: '👥' },
  ]

  const moreItems = [
    { href: '/discussions', labelKey: 'nav.discuss' as const, icon: '💬' },
    { href: '/collection', labelKey: 'nav.collection' as const, icon: '🃏' },
    { href: '/alerts', labelKey: 'nav.alerts' as const, icon: '🔔' },
  ]

  return (
    <nav className="border-b border-[#e8eaf0]/60 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#818cf8] flex items-center justify-center shadow-sm shadow-[#6366f1]/20">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <span className="text-lg font-bold text-[#1e2235] tracking-tight hidden sm:block">
              TCG Vault
            </span>
          </Link>

          {/* Center nav - pill style */}
          <div className="hidden md:flex items-center bg-[#f5f6fa] rounded-full p-1 gap-0.5">
            {navItems.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-white text-[#6366f1] shadow-sm'
                    : 'text-[#8b8fa6] hover:text-[#1e2235] hover:bg-white/60'
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}

            {/* More dropdown */}
            <div className="relative group">
              <button className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                moreItems.some(i => i.href === pathname)
                  ? 'bg-white text-[#6366f1] shadow-sm'
                  : 'text-[#8b8fa6] hover:text-[#1e2235] hover:bg-white/60'
              }`}>
                {isThai ? 'เพิ่มเติม' : 'More'}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#e8eaf0] rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-1.5 z-50">
                {moreItems.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                      pathname === link.href
                        ? 'text-[#6366f1] bg-[#6366f1]/5'
                        : 'text-[#5c6078] hover:text-[#1e2235] hover:bg-[#f5f6fa]'
                    }`}
                  >
                    <span>{link.icon}</span>
                    {t(link.labelKey)}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <LangToggle />
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                {isGuest ? (
                  <Link
                    href="/login"
                    className="text-xs px-4 py-2 bg-[#6366f1] text-white rounded-full hover:bg-[#4f46e5] transition-all font-semibold shadow-sm shadow-[#6366f1]/20"
                  >
                    {t('nav.signIn')}
                  </Link>
                ) : (
                  <>
                    {/* Admin */}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f5f6fa] transition-colors"
                        title="Admin"
                      >
                        <span className="text-sm">🛡️</span>
                      </Link>
                    )}
                    {/* Seller */}
                    <Link
                      href="/seller/apply"
                      className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f5f6fa] transition-colors"
                      title={isThai ? 'สมัครเป็นผู้ขาย' : 'Seller'}
                    >
                      <span className="text-sm">🏪</span>
                      </Link>
                    {/* Notifications */}
                    <Link
                      href="/notifications"
                      className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f5f6fa] transition-colors"
                    >
                      <span className="text-sm">🔔</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                    {/* Avatar */}
                    <Link
                      href={`/u/${user?.email?.split('@')[0] || ''}`}
                      className="hidden sm:flex items-center gap-2 pl-2"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#6366f1]/10 flex items-center justify-center text-xs font-bold text-[#6366f1]">
                        {user?.email?.charAt(0).toUpperCase()}
                      </div>
                    </Link>
                    {/* Logout */}
                    <button
                      onClick={logout}
                      className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-50 transition-colors text-[#b5b8c8] hover:text-red-400"
                      title={t('nav.signOut')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm px-5 py-2 bg-[#6366f1] text-white font-semibold rounded-full hover:bg-[#4f46e5] transition-all shadow-sm shadow-[#6366f1]/25"
              >
                {t('nav.signIn')}
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f5f6fa] transition-colors"
              aria-label="Menu"
            >
              <svg className="w-5 h-5 text-[#1e2235]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#e8eaf0]/60 bg-white/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {[...navItems, ...moreItems].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'text-[#6366f1] bg-[#6366f1]/5'
                    : 'text-[#5c6078] hover:text-[#1e2235] hover:bg-[#f5f6fa]'
                }`}
              >
                <span>{link.icon}</span>
                {t(link.labelKey)}
              </Link>
            ))}

            {isAuthenticated && !isGuest && (
              <>
                <div className="border-t border-[#e8eaf0]/60 my-2" />
                {isAdmin && (
                  <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#5c6078] hover:text-[#6366f1] hover:bg-[#6366f1]/5 transition-all">
                    <span>🛡️</span> Admin
                  </Link>
                )}
                <Link href="/seller/apply" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#5c6078] hover:text-[#6366f1] hover:bg-[#6366f1]/5 transition-all">
                  <span>🏪</span> {isThai ? 'สมัครเป็นผู้ขาย' : 'Seller'}
                </Link>
                <Link href={`/u/${user?.email?.split('@')[0] || ''}`} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#5c6078] hover:text-[#6366f1] hover:bg-[#6366f1]/5 transition-all">
                  <span>👤</span> {isThai ? 'โปรไฟล์' : 'Profile'}
                </Link>
              </>
            )}

            <div className="border-t border-[#e8eaf0]/60 my-2" />
            <div className="px-4 py-2 flex items-center justify-between">
              <LangToggle />
              {isAuthenticated && !isGuest && (
                <button
                  onClick={logout}
                  className="text-sm font-medium text-red-400 hover:text-red-500 transition-colors"
                >
                  {t('nav.signOut')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}