import Link from 'next/link'
import Navbar from '@/components/Navbar'
import MarvelFeaturedCarousel from '@/components/MarvelFeaturedCarousel'
import EnergyBolts from '@/components/EnergyBolts'
import CosmicBackground from '@/components/CosmicBackground'
import Aurora from '@/components/Aurora'
import Reveal from '@/components/Reveal'
import TiltCard from '@/components/TiltCard'
import Intro from '@/components/Intro'
import { marvelCards, marvelSets, MARVEL, RARITY_ORDER, marvelCharacterOf } from '@/lib/marvel'
import { getMarvelPrices } from '@/lib/marvel-prices.server'
import { getServerT } from '@/lib/i18n.server'
import products from '@/lib/marvel-products.json'

const PRODUCT_GLOW: Record<string, string> = {
  BP01: 'rgba(236,29,36,0.28)',
  SD01: 'rgba(240,53,59,0.26)',
  SD02: 'rgba(245,192,51,0.24)',
  SD03: 'rgba(59,130,246,0.26)',
  SD04: 'rgba(34,192,122,0.24)',
}

const SET_META: Record<string, { th: string; en: string; accent: string; emoji: string }> = {
  BP01: { th: 'บูสเตอร์ Avengers', en: 'Avengers Booster', accent: 'from-marvel to-marvel-deep', emoji: '📦' },
  SD01: { th: 'สตาร์ทเตอร์ · Reality', en: 'Starter · Reality', accent: 'from-attr-red to-marvel-deep', emoji: '🔴' },
  SD02: { th: 'สตาร์ทเตอร์ · Mind', en: 'Starter · Mind', accent: 'from-attr-yellow to-gold', emoji: '🟡' },
  SD03: { th: 'สตาร์ทเตอร์ · Space', en: 'Starter · Space', accent: 'from-attr-blue to-cosmic-blue', emoji: '🔵' },
  SD04: { th: 'สตาร์ทเตอร์ · Time', en: 'Starter · Time', accent: 'from-attr-green to-cosmic-cyan', emoji: '🟢' },
}

export default async function Home() {
  const { locale, t } = await getServerT()
  const prices = await getMarvelPrices()
  const rIdx = (r: string) => RARITY_ORDER.indexOf(r as typeof RARITY_ORDER[number])
  // Highest-rarity characters, most valuable first — for the featured carousel.
  const featured = marvelCards
    .filter((c) => rIdx(c.rarity) >= RARITY_ORDER.indexOf('SR') && c.cardType === 'character')
    .sort((a, b) => (prices[b.id] ?? -1) - (prices[a.id] ?? -1) || rIdx(b.rarity) - rIdx(a.rarity))
    .slice(0, 16)

  // Hero "hand of cards": 5 top cards, one per distinct character for variety.
  const seenChar = new Set<string>()
  const heroHand = featured
    .filter((c) => {
      const ch = marvelCharacterOf(c.name)
      if (seenChar.has(ch)) return false
      seenChar.add(ch)
      return true
    })
    .slice(0, 5)

  return (
    <div className="min-h-screen flex flex-col">
      <Intro cards={heroHand.map((c) => c.image)} />
      <Navbar />

      {/* ===== HERO (official cinematic banner) ===== */}
      <section className="relative overflow-hidden">
        {/* official key art background */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hero-bg.webp" alt="" className="w-full h-full object-cover object-center" />
          {/* legibility + brand overlays */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(75% 90% at 50% 38%, rgba(8,8,15,0.30), rgba(8,8,15,0.86) 78%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-44" style={{ background: 'linear-gradient(to top, var(--color-void), transparent)' }} />
          <div className="absolute inset-x-0 top-0 h-24" style={{ background: 'linear-gradient(to bottom, rgba(8,8,15,0.7), transparent)' }} />
        </div>
        {/* Aurora ribbons (React Bits) glowing over the key art */}
        <div className="absolute inset-x-0 top-0 h-[80%] mix-blend-screen opacity-70 pointer-events-none">
          <Aurora colorStops={['#ff2b39', '#a855f7', '#22d3ee']} amplitude={1.1} blend={0.55} speed={0.8} />
        </div>
        <CosmicBackground />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 flex flex-col items-center text-center">
          {/* official MARVEL HERO RUSH logo */}
          <h1 className="w-full flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/herorush-logo.webp"
              alt="MARVEL Hero Rush"
              className="w-[min(88vw,540px)] max-w-full drop-shadow-[0_4px_36px_rgba(236,29,36,0.45)]"
            />
          </h1>

          {/* THAILAND official badge */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-marvel/15 border border-marvel/40 text-marvel-bright text-xs font-bold backdrop-blur-sm">
            {t('mhr.home.badge')}
          </div>

          <p className="text-body text-sm sm:text-base max-w-xl mt-6 leading-relaxed">
            {t('mhr.home.subtitle')}
          </p>

          {/* search */}
          <form action="/card/marvel" method="get" className="relative w-full max-w-md mt-7">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">🔍</span>
            <input
              name="q"
              placeholder={t('mhr.home.searchPlaceholder')}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-abyss/80 border border-line text-sm text-hero placeholder:text-faint focus:outline-none focus:border-cosmic/60 backdrop-blur-sm"
            />
          </form>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Link href="/card/marvel" className="px-6 py-3 btn-primary rounded-xl font-bold text-sm">
              {t('mhr.home.ctaAll')} <span className="ml-1">→</span>
            </Link>
            <Link href="/sets" className="px-6 py-3 btn-ghost rounded-xl font-bold text-sm backdrop-blur-sm">
              {t('mhr.home.ctaSets')}
            </Link>
          </div>

          <div className="flex items-start gap-5 sm:gap-8 mt-9">
            <Stat value={String(MARVEL.total)} label={t('mhr.stat.totalCards')} />
            <div className="w-px h-9 bg-line mt-1" />
            <Stat value={String(marvelSets.length)} label={t('mhr.stat.sets')} />
            <div className="w-px h-9 bg-line mt-1" />
            <div className="text-center lg:text-left">
              <div className="font-display text-2xl font-extrabold text-gold-bright leading-none">{t('mhr.priceGuide')}</div>
              <div className="text-xs font-extrabold text-cosmic-cyan mt-1 leading-tight max-w-[10rem] mx-auto lg:mx-0">
                {t('mhr.nav.byAssoc')}
              </div>
            </div>
          </div>

          {/* real "hand of cards" — fanned, 3D on hover, clickable */}
          <div className="relative mt-14 h-[360px] w-full max-w-3xl hidden md:block">
            {heroHand.map((c, i) => {
              const mid = (heroHand.length - 1) / 2
              const off = i - mid
              return (
                // outer: fan positioning only (no animation, so translateX/rotate survive)
                <div
                  key={c.id}
                  className="absolute left-1/2 top-2"
                  style={{
                    transform: `translateX(-50%) translateX(${off * 122}px) translateY(${Math.abs(off) * 26}px) rotate(${off * 9}deg)`,
                    zIndex: 10 - Math.abs(off),
                  }}
                >
                  {/* inner: gentle float (separate element → no transform clash) */}
                  <div className="animate-float" style={{ animationDelay: `${i * 0.6}s` }}>
                    <Link href={`/card/marvel/${c.id}`}>
                      <TiltCard holo max={12} className="rounded-xl">
                        <div className="rounded-xl overflow-hidden border border-line" style={{ boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.image} alt={c.cardNo} className="w-44 sm:w-52 block" />
                        </div>
                      </TiltCard>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== SETS ===== */}
      <Reveal as="section" className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-8">
          <div className="section-eyebrow mb-2">Expansions</div>
          <h2 className="section-title neon-title text-4xl sm:text-5xl font-extrabold">{t('mhr.sec.expansions')}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {marvelSets.map((s) => {
            const meta = SET_META[s.id] || { th: s.name, en: s.name, accent: 'from-cosmic to-cosmic-blue', emoji: '🃏' }
            const metaName = locale === 'en' ? meta.en : meta.th
            const box = products.find((p) => p.series === s.id)?.image
            return (
              <Link key={s.id} href={`/set/marvel/${s.id}`} className="mv-card rounded-2xl p-4 group flex flex-col items-center text-center">
                <div className="relative w-full aspect-[3/4] grid place-items-center mb-3">
                  <div className="absolute inset-0" style={{ background: `radial-gradient(60% 50% at 50% 45%, ${PRODUCT_GLOW[s.id] || 'rgba(139,92,246,0.22)'}, transparent 70%)` }} />
                  {box ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={box} alt={metaName} className="relative max-h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.accent} grid place-items-center text-2xl`}>{meta.emoji}</div>
                  )}
                </div>
                <div className="text-[11px] font-bold text-marvel tracking-wide">{s.code}</div>
                <div className="text-sm font-bold text-hero mt-0.5 group-hover:text-cosmic transition-colors">{metaName}</div>
                <div className="text-xs text-muted mt-1">{s.total} {t('mhr.cards')}</div>
              </Link>
            )
          })}
        </div>
      </Reveal>

      {/* ===== FEATURED CARDS (full-bleed feature band) ===== */}
      <Reveal>
      <div className="gold-rule" />
      <section className="carbon-bg relative overflow-hidden py-14">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(50rem 24rem at 50% 0%, rgba(168,85,247,0.14), transparent 60%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="section-eyebrow mb-2">Featured Cards</div>
            <h2 className="section-title neon-title text-4xl sm:text-5xl font-extrabold">{t('mhr.sec.featured')}</h2>
            <p className="text-sm text-muted mt-3">{t('mhr.sec.featuredSub')}</p>
          </div>
          <div className="relative px-6 sm:px-10">
            <EnergyBolts side="left" />
            <EnergyBolts side="right" />
            <MarvelFeaturedCarousel cards={featured} prices={prices} />
          </div>
          <div className="text-center mt-9">
            <Link href="/card/marvel" className="pill-cta">{t('mhr.home.ctaAll')} <span>→</span></Link>
          </div>
        </div>
      </section>
      <div className="gold-rule" />
      </Reveal>

      {/* ===== WHY ===== */}
      <Reveal as="section" className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: '🏅', title: t('mhr.why1.title'), desc: t('mhr.why1.desc') },
            { icon: '🔄', title: t('mhr.why2.title'), desc: t('mhr.why2.desc') },
            { icon: '🗂️', title: t('mhr.why3.title'), desc: t('mhr.why3.desc') },
          ].map((f) => (
            <div key={f.title} className="mv-panel rounded-2xl p-5">
              <div className="w-11 h-11 rounded-xl bg-cosmic/12 border border-cosmic/25 grid place-items-center text-xl mb-3">{f.icon}</div>
              <h3 className="font-display text-base font-bold text-hero mb-1.5">{f.title}</h3>
              <p className="text-sm text-body leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ===== FOOTER ===== */}
      <footer className="mt-auto border-t border-line/70 bg-abyss/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-6">
            {/* brand */}
            <div className="col-span-2 md:col-span-4">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/superhero-th.webp" alt="SuperHero Thailand" className="h-12 w-auto" />
                <div className="leading-tight">
                  <div className="font-display text-lg font-extrabold text-hero">VAULT<span className="text-cosmic">VERSE</span></div>
                  <div className="text-[11px] text-muted mt-1">{t('mhr.nav.byAssoc')}</div>
                </div>
              </div>
              <p className="text-xs text-muted mt-4 max-w-xs leading-relaxed">{t('mhr.footer.tagline')}</p>
            </div>

            {/* menu */}
            <div className="md:col-span-2">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-faint mb-3">{t('mhr.footer.menu')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-body hover:text-cosmic transition-colors">{t('mhr.nav.home')}</Link></li>
                <li><Link href="/card/marvel" className="text-body hover:text-cosmic transition-colors">{t('mhr.nav.cards')}</Link></li>
                <li><Link href="/sets" className="text-body hover:text-cosmic transition-colors">{t('mhr.nav.sets')}</Link></li>
              </ul>
            </div>

            {/* sets */}
            <div className="md:col-span-2">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-faint mb-3">{t('mhr.nav.sets')}</h4>
              <ul className="space-y-2 text-sm">
                {marvelSets.map((s) => {
                  const meta = SET_META[s.id]
                  const name = meta ? (locale === 'en' ? meta.en : meta.th) : s.name
                  return (
                    <li key={s.id}>
                      <Link href={`/set/marvel/${s.id}`} className="text-body hover:text-cosmic transition-colors">
                        <span className="text-marvel font-bold mr-1.5">{s.code}</span>{name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* contact */}
            <div className="col-span-2 md:col-span-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-faint mb-3">{t('mhr.footer.contact')}</h4>
              <p className="text-xs text-muted mb-3">{t('mhr.footer.followFb')}</p>
              <div className="flex flex-col gap-3">
                <a
                  href="https://web.facebook.com/groups/1294005495982423?locale=th_TH"
                  target="_blank" rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 text-sm text-body hover:text-hero transition-colors"
                >
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-[#1877F2]/12 text-[#4293ff] border border-[#1877F2]/30 group-hover:bg-[#1877F2]/22 transition-colors shrink-0">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
                  </span>
                  <span className="break-all">facebook.com/groups/1294005495982423</span>
                </a>
                <a
                  href="mailto:marvelherorush.th@gmail.com"
                  className="group inline-flex items-center gap-3 text-sm text-body hover:text-hero transition-colors"
                >
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-cosmic/12 text-cosmic border border-cosmic/30 group-hover:bg-cosmic/22 transition-colors shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.5 7l8.5 6 8.5-6" /></svg>
                  </span>
                  <span className="break-all">marvelherorush.th@gmail.com</span>
                </a>
              </div>
            </div>
          </div>

          {/* bottom bar */}
          <div className="mt-10 pt-6 border-t border-line/50 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-muted text-center sm:text-left">{t('mhr.footer.disclaimer')}</p>
            <p className="text-[11px] text-faint">© {new Date().getFullYear()} {t('mhr.assoc')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Stat({ value, label, gold }: { value: string; label: string; gold?: boolean }) {
  return (
    <div className="text-center lg:text-left">
      <div className={`font-display text-2xl font-extrabold ${gold ? 'text-gold-bright' : 'text-hero'}`}>{value}</div>
      <div className="text-[11px] text-muted mt-0.5">{label}</div>
    </div>
  )
}

