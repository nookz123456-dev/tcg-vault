import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MarvelBrowser from '@/components/MarvelBrowser'
import MarvelFeaturedCarousel from '@/components/MarvelFeaturedCarousel'
import EnergyBolts from '@/components/EnergyBolts'
import Reveal from '@/components/Reveal'
import { marvelSets, RARITY_ORDER } from '@/lib/marvel'
import { getMarvelPrices } from '@/lib/marvel-prices.server'
import { getMergedCards } from '@/lib/marvel-variants.server'
import { getServerT } from '@/lib/i18n.server'
import products from '@/lib/marvel-products.json'

const SET_STYLE: Record<string, { emoji: string; glow: string; accent: string; sub: string; subEn: string; tagline: string; taglineEn: string }> = {
  BP01: { emoji: '📦', glow: 'rgba(236,29,36,0.35)', accent: 'from-marvel to-marvel-deep', sub: 'บูสเตอร์หลัก', subEn: 'Main Booster', tagline: 'รวมฮีโร่และวายร้ายจากทั่วมัลติเวิร์ส', taglineEn: 'Heroes and villains from across the multiverse' },
  SD01: { emoji: '🔴', glow: 'rgba(240,53,59,0.32)', accent: 'from-attr-red to-marvel-deep', sub: 'Reality Stone', subEn: 'Reality Stone', tagline: 'สตาร์ทเตอร์เด็คสายพลังเรียลลิตี้', taglineEn: 'Reality-power starter deck' },
  SD02: { emoji: '🟡', glow: 'rgba(245,192,51,0.30)', accent: 'from-attr-yellow to-gold', sub: 'Mind Stone', subEn: 'Mind Stone', tagline: 'สตาร์ทเตอร์เด็คสายพลังจิต', taglineEn: 'Mind-power starter deck' },
  SD03: { emoji: '🔵', glow: 'rgba(59,130,246,0.32)', accent: 'from-attr-blue to-cosmic-blue', sub: 'Space Stone', subEn: 'Space Stone', tagline: 'สตาร์ทเตอร์เด็คสายพลังอวกาศ', taglineEn: 'Space-power starter deck' },
  SD04: { emoji: '🟢', glow: 'rgba(34,192,122,0.30)', accent: 'from-attr-green to-cosmic-cyan', sub: 'Time Stone', subEn: 'Time Stone', tagline: 'สตาร์ทเตอร์เด็คสายพลังเวลา', taglineEn: 'Time-power starter deck' },
}

export async function generateMetadata({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params
  const set = marvelSets.find((s) => s.id === setId)
  return { title: set ? `${set.name} (${set.code}) · Marvel Hero Rush | Vaultverse` : 'ไม่พบเซ็ต | Vaultverse' }
}

export default async function MarvelSetPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params
  const set = marvelSets.find((s) => s.id === setId)
  if (!set) notFound()

  const { locale, t } = await getServerT()
  const prices = await getMarvelPrices()
  const st = SET_STYLE[set.id] || { emoji: '🃏', glow: 'rgba(139,92,246,0.3)', accent: 'from-cosmic to-cosmic-blue', sub: '', subEn: '', tagline: '', taglineEn: '' }
  const stSub = locale === 'en' ? st.subEn : st.sub
  const stTagline = locale === 'en' ? st.taglineEn : st.tagline
  const product = products.find((p) => p.series === set.id)

  const merged = await getMergedCards()
  const setCards = merged.filter((c) => c.series === set.id)
  const rIdx = (r: string) => RARITY_ORDER.indexOf(r as typeof RARITY_ORDER[number])
  // Featured = the set's rarest cards (SR and up), most valuable first.
  const featured = setCards
    .filter((c) => rIdx(c.rarity) >= RARITY_ORDER.indexOf('SR'))
    .sort((a, b) => (prices[b.id] ?? -1) - (prices[a.id] ?? -1) || rIdx(b.rarity) - rIdx(a.rarity))
    .slice(0, 16)
  // A few cards to float behind the hero as atmosphere.
  const heroArt = [...featured].slice(0, 4)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden border-b border-line/70">
        <div className="absolute inset-0" style={{ background: `radial-gradient(60rem 30rem at 50% -10%, ${st.glow}, transparent 65%)` }} />
        {/* floating card art */}
        <div className="absolute inset-0 opacity-20 pointer-events-none hidden md:block">
          {heroArt.map((c, i) => (
            <img
              key={c.id}
              // eslint-disable-next-line @next/next/no-img-element
              src={c.image}
              alt=""
              className="absolute w-40 rounded-xl blur-[1px]"
              style={{ left: `${[6, 74, 20, 86][i]}%`, top: `${[30, 18, 66, 60][i]}%`, transform: `rotate(${[-12, 10, 8, -8][i]}deg)` }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          {product ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} className="w-36 sm:w-44 mx-auto mb-6 drop-shadow-2xl animate-float" />
          ) : (
            <div className={`inline-grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br ${st.accent} text-3xl mb-5 shadow-2xl`}>{st.emoji}</div>
          )}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-marvel/15 text-marvel-bright border border-marvel/30">{set.code}</span>
            {stSub && <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cosmic/12 text-cosmic border border-cosmic/25">{stSub}</span>}
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-hero leading-none">{set.name}</h1>
          {stTagline && <p className="text-body text-sm sm:text-base mt-4 max-w-xl mx-auto">{stTagline}</p>}
          <div className="flex items-center justify-center gap-8 mt-7">
            <div><div className="font-display text-2xl font-extrabold text-hero">{setCards.length}</div><div className="text-[11px] text-muted mt-0.5">{t('mhr.set.cardsInSet')}</div></div>
            <div className="w-px h-9 bg-line" />
            <div><div className="font-display text-2xl font-extrabold text-gold-bright">{featured.length}</div><div className="text-[11px] text-muted mt-0.5">{t('mhr.set.highRarity')}</div></div>
          </div>
        </div>
      </section>

      {/* ===== STICKY SECTION TABS ===== */}
      <nav className="tabs-sticky">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6">
          <a href="#featured" className="py-3.5 text-sm font-semibold text-body hover:text-hero border-b-2 border-transparent hover:border-cosmic transition-colors">{t('mhr.set.tabFeatured')}</a>
          <a href="#all" className="py-3.5 text-sm font-semibold text-body hover:text-hero border-b-2 border-transparent hover:border-cosmic transition-colors">{t('mhr.set.tabAll')}</a>
          <Link href="/card/marvel" className="py-3.5 text-sm font-semibold text-muted hover:text-cosmic ml-auto">← {t('mhr.set.allSets')}</Link>
        </div>
      </nav>

      {/* ===== FEATURED CARDS ===== */}
      {featured.length > 0 && (
        <>
          <div className="gold-rule" />
          <section id="featured" className="carbon-bg relative overflow-hidden py-14 scroll-mt-28">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(50rem 24rem at 50% 0%, rgba(168,85,247,0.14), transparent 60%)' }} />
            <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <div className="section-eyebrow mb-2">Featured Cards</div>
                <h2 className="section-title neon-title text-4xl sm:text-5xl font-extrabold">{t('mhr.set.featuredHeading')}</h2>
                <p className="text-sm text-muted mt-3">{t('mhr.set.featuredSub')}</p>
              </div>
              <div className="relative px-6 sm:px-10">
                <EnergyBolts side="left" />
                <EnergyBolts side="right" />
                <MarvelFeaturedCarousel cards={featured} prices={prices} />
              </div>
            </div>
          </section>
          <div className="gold-rule" />
        </>
      )}

      {/* ===== ALL CARDS ===== */}
      <section id="all" className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 pb-16 scroll-mt-28">
        <Reveal className="text-center mb-8">
          <div className="section-eyebrow mb-2">All Cards</div>
          <h2 className="section-title neon-title text-4xl sm:text-5xl font-extrabold">{t('mhr.set.allHeadingPrefix')} {setCards.length} {t('mhr.set.allHeadingSuffix')}</h2>
        </Reveal>
        <MarvelBrowser cards={merged} sets={marvelSets} prices={prices} initialSeries={set.id} />
      </section>
    </div>
  )
}
