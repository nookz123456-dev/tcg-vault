'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import { LangToggle } from '@/components/LangToggle'
import { useT } from '@/lib/i18n'
import { useWishlist } from '@/lib/wishlist'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const tt = useT()
  const { count: wishlistCount } = useWishlist()
  const { user } = useAuth()
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

  useEffect(() => { setMenuOpen(false) }, [pathname])

  const navItems = [
    { href: '/', icon: '🏠', key: 'mhr.nav.home' as const },
    { href: '/card/marvel', icon: '🃏', key: 'mhr.nav.cards' as const },
    { href: '/sets', icon: '📂', key: 'mhr.nav.sets' as const },
    { href: '/wishlist', icon: '⭐', key: 'mhr.nav.wishlist' as const },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="border-b border-line/70 bg-abyss/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo — official HERO RUSH mark */}
          <Link href="/" className="flex items-center shrink-0" title="Marvel Hero Rush Thailand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/herorush-logo.webp" alt="Marvel Hero Rush" className="h-9 sm:h-10 w-auto" />
          </Link>

          {/* Center nav - pill style */}
          <div className="hidden md:flex items-center bg-surface/70 border border-line-soft rounded-full p-1 gap-0.5">
            {navItems.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  isActive(link.href)
                    ? 'bg-surface-2 text-hero shadow-sm ring-1 ring-cosmic/30'
                    : 'text-muted hover:text-hero hover:bg-white/5'
                }`}
              >
                {tt(link.key)}
                {link.href === '/wishlist' && wishlistCount > 0 && (
                  <span className="ml-1.5 inline-grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-gold/20 text-gold-bright text-[10px] font-bold align-middle">{wishlistCount}</span>
                )}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* association mark */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[9px] font-semibold text-faint uppercase tracking-wider">by</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/superhero-th.webp" alt="สมาคมผู้คลั่งไคล้ SuperHero" title="โดย สมาคมผู้คลั่งไคล้ SuperHero" className="h-7 w-auto" />
              <div className="w-px h-6 bg-line ml-1" />
            </div>
            <div className="hidden sm:block">
              <LangToggle />
            </div>

            {isAdmin && (
              <Link href="/admin/marvel-prices" className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/5 transition-colors" title="ตั้งราคากลาง (แอดมิน)">
                <span className="text-sm">🛡️</span>
              </Link>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/5 transition-colors" aria-label="Menu">
              <svg className="w-5 h-5 text-hero" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="md:hidden border-t border-line/70 bg-abyss/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive(link.href) ? 'text-hero bg-cosmic/10' : 'text-body hover:text-hero hover:bg-white/5'
                }`}
              >
                <span>{link.icon}</span>
                {tt(link.key)}
                {link.href === '/wishlist' && wishlistCount > 0 && (
                  <span className="ml-auto inline-grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full bg-gold/20 text-gold-bright text-[11px] font-bold">{wishlistCount}</span>
                )}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin/marvel-prices" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-body hover:text-hero hover:bg-white/5 transition-all">
                <span>🛡️</span> ตั้งราคากลาง
              </Link>
            )}

            <div className="mv-hr my-2" />
            <div className="px-4 py-2 flex items-center justify-between">
              <LangToggle />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/superhero-th.webp" alt="สมาคมผู้คลั่งไคล้ SuperHero" className="h-6 w-auto opacity-90" />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
