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

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

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
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="text-xl sm:text-2xl transition-transform group-hover:scale-110">🃏</span>
            <span className="text-lg sm:text-xl font-bold text-[#6366f1] tracking-tight">
              TCG Vault
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
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
                {t(link.labelKey)}
              </Link>
            ))}
          </div>

          {/* Auth + Language */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <LangToggle />
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {isGuest ? (
                  <Link
                    href="/login"
                    className="text-xs px-3 py-1.5 bg-[#6366f1]/10 text-[#6366f1] rounded-lg hover:bg-[#6366f1]/20 transition-colors font-semibold"
                  >
                    {t('nav.signIn')}
                  </Link>
                ) : (
                  <>
                    {/* Desktop-only icons */}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="hidden sm:flex p-2 rounded-lg hover:bg-[#6366f1]/5 transition-colors"
                        title="Admin Panel"
                      >
                        <span className="text-lg">🛡️</span>
                      </Link>
                    )}
                    <Link
                      href="/seller/apply"
                      className="hidden sm:flex p-2 rounded-lg hover:bg-[#6366f1]/5 transition-colors"
                      title={isThai ? 'สมัครเป็นผู้ขาย' : 'Become a Seller'}
                    >
                      <span className="text-lg">🏪</span>
                    </Link>
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
                    <Link
                      href="/trades"
                      className="hidden sm:flex p-2 rounded-lg hover:bg-[#6366f1]/5 transition-colors"
                    >
                      <span className="text-lg">🤝</span>
                    </Link>
                    <Link
                      href={`/u/${user?.email?.split('@')[0] || ''}`}
                      className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[#6366f1]/5 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#6366f1]/10 flex items-center justify-center text-xs font-bold text-[#6366f1]">
                        {user?.email?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-[#5c6078]">{user?.email?.split('@')[0]}</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="hidden sm:block text-xs px-3 py-1.5 bg-white text-[#5c6078] rounded-lg hover:text-[#1e2235] transition-colors border border-[#e8eaf0]"
                    >
                      {t('nav.signOut')}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm px-4 py-2 bg-[#6366f1] text-white font-semibold rounded-lg hover:bg-[#4f46e5] transition-all shadow-sm shadow-[#6366f1]/25"
              >
                {t('nav.signIn')}
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[#6366f1]/5 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6 text-[#1e2235]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="md:hidden border-t border-[#e8eaf0] bg-white">
          <div className="px-4 py-3 space-y-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-[#6366f1] bg-[#6366f1]/5'
                    : 'text-[#5c6078] hover:text-[#6366f1] hover:bg-[#6366f1]/5'
                }`}
              >
                <span>{link.icon}</span>
                {t(link.labelKey)}
              </Link>
            ))}

            {/* Mobile-only items */}
            {isAuthenticated && !isGuest && (
              <>
                <div className="border-t border-[#e8eaf0] my-2" />
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[#5c6078] hover:text-[#6366f1] hover:bg-[#6366f1]/5 transition-colors"
                  >
                    <span>🛡️</span> Admin Panel
                  </Link>
                )}
                <Link
                  href="/seller/apply"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[#5c6078] hover:text-[#6366f1] hover:bg-[#6366f1]/5 transition-colors"
                >
                  <span>🏪</span> {isThai ? 'สมัครเป็นผู้ขาย' : 'Become a Seller'}
                </Link>
                <Link
                  href="/trades"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[#5c6078] hover:text-[#6366f1] hover:bg-[#6366f1]/5 transition-colors"
                >
                  <span>🤝</span> {isThai ? 'แลกเปลี่ยน' : 'Trades'}
                </Link>
                <Link
                  href={`/u/${user?.email?.split('@')[0] || ''}`}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[#5c6078] hover:text-[#6366f1] hover:bg-[#6366f1]/5 transition-colors"
                >
                  <span>👤</span> {isThai ? 'โปรไฟล์' : 'Profile'}
                </Link>
              </>
            )}

            <div className="border-t border-[#e8eaf0] my-2" />

            {/* Language toggle in mobile menu */}
            <div className="px-3 py-2">
              <LangToggle />
            </div>

            {isAuthenticated && !isGuest && (
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/5 transition-colors"
              >
                {t('nav.signOut')}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}