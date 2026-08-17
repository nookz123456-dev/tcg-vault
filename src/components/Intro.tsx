'use client'

import { useEffect, useState } from 'react'

// Cinematic one-time intro: MARVEL logo → HERORUSH glow → THAILAND → fade to
// site. Shows once per session (sessionStorage), skippable, respects
// prefers-reduced-motion (CSS hides it entirely).
export default function Intro({ cards = [] }: { cards?: string[] }) {
  const [phase, setPhase] = useState<'hidden' | 'playing' | 'out'>('hidden')

  useEffect(() => {
    if (sessionStorage.getItem('vv_intro_seen')) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sessionStorage.setItem('vv_intro_seen', '1')
      return
    }
    sessionStorage.setItem('vv_intro_seen', '1')
    setPhase('playing')
    document.body.style.overflow = 'hidden'
    const tOut = setTimeout(() => setPhase('out'), 3200)
    const tEnd = setTimeout(() => {
      setPhase('hidden')
      document.body.style.overflow = ''
    }, 3900)
    return () => {
      clearTimeout(tOut)
      clearTimeout(tEnd)
      document.body.style.overflow = ''
    }
  }, [])

  const skip = () => {
    setPhase('out')
    setTimeout(() => {
      setPhase('hidden')
      document.body.style.overflow = ''
    }, 600)
  }

  if (phase === 'hidden') return null

  return (
    <div className={`intro-overlay ${phase === 'out' ? 'intro-out' : ''}`} onClick={skip}>
      <span className="intro-glow" />

      {/* cards fly up into a fan behind the logo */}
      {cards.length > 0 && (
        <div className="intro-cards">
          {cards.slice(0, 5).map((src, i, arr) => {
            const off = i - (arr.length - 1) / 2
            return (
              <div key={i} className="intro-card" style={{ ['--x' as string]: `${off * 92}px`, ['--r' as string]: `${off * 10}deg`, zIndex: 5 - Math.abs(off) }}>
                <div className="intro-card-fly" style={{ animationDelay: `${0.5 + i * 0.12}s` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="intro-content">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/herorush-logo.webp" alt="MARVEL Hero Rush" className="intro-logo" />
        <div className="intro-tagline">Trading Card Game · Thailand</div>
      </div>
      <button className="intro-skip" onClick={(e) => { e.stopPropagation(); skip() }}>
        ข้าม ✕
      </button>
    </div>
  )
}
