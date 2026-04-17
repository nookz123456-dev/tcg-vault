'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const { user, isGuest, isAuthenticated, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

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
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/search', label: 'Search', icon: '🔍' },
    { href: '/sealed', label: 'Sealed', icon: '📦' },
    { href: '/discussions', label: 'Discuss', icon: '💬' },
    { href: '/community', label: 'Community', icon: '👥' },
    { href: '/collection', label: 'Collection', icon: '🃏' },
  ]

  return (
    <nav className="border-b border-[var(--card-border)] bg-[var(--surface-1)]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="text-2xl transition-transform group-hover:scale-110">🃏</span>
            <span className="text-xl font-bold text-amber-400 tracking-tight">
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
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-[var(--warm-300)] hover:text-amber-400 hover:bg-[var(--surface-2)]'
                }`}
              >
                <span className="mr-1">{link.icon}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {isGuest ? (
                  <Link
                    href="/login"
                    className="text-xs px-4 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors font-semibold"
                  >
                    Sign In
                  </Link>
                ) : (
                  <>
                    {/* Notifications bell */}
                    <Link
                      href="/notifications"
                      className="relative p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
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
                      className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <span className="text-lg">🤝</span>
                    </Link>

                    {/* Profile */}
                    <Link
                      href={`/u/${user?.email?.split('@')[0] || ''}`}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-amber-500/10 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400">
                        {user?.email?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-[var(--warm-300)] hidden sm:block">{user?.email?.split('@')[0]}</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="text-xs px-3 py-1.5 bg-[var(--surface-1)] text-[var(--warm-300)] rounded-lg hover:text-[var(--foreground)] transition-colors border border-[var(--card-border)]"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm px-5 py-2 bg-amber-500 text-[var(--warm-900)] font-bold rounded-xl hover:bg-amber-400 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}