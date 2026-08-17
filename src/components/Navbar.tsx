'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import { LangToggle } from '@/components/LangToggle'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
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
    { href: '/card/marvel', icon: '🃏', fallback: 'การ์ดทั้งหมด' },
    { href: '/sets', icon: '📂', fallback: 'เซ็ต' },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="border-b border-line/70 bg-abyss/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-9 h-9 grid place-items-center">
              <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none">
                <defs>
                  <linearGradient id="vv" x1="0" y1="0" x2="40" y2="40">
                    <stop offset="0" stopColor="#ff2b39" />
                    <stop offset="0.55" stopColor="#8b5cf6" />
                    <stop offset="1" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
                <path d="M20 3l14.7 8.5v17L20 37 5.3 28.5v-17L20 3z" stroke="url(#vv)" strokeWidth="2" fill="rgba(139,92,246,0.08)" />
                <path d="M13 14l7 13 7-13" stroke="url(#vv)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-[17px] font-extrabold text-hero tracking-tight font-display">VAULT<span className="text-cosmic">VERSE</span></span>
              <span className="text-[10px] font-semibold text-marvel tracking-tight">โดย สมาคมผู้คลั่งไคล้ SuperHero</span>
            </div>
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
                {link.fallback}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
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
                {link.fallback}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin/marvel-prices" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-body hover:text-hero hover:bg-white/5 transition-all">
                <span>🛡️</span> ตั้งราคากลาง
              </Link>
            )}

            <div className="mv-hr my-2" />
            <div className="px-4 py-2">
              <LangToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
