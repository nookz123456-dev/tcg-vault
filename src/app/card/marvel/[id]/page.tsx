import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import {
  cleanMarvelName, formatTHB,
  RARITY_META, RARITY_ORDER, ATTR_META, marvelSets,
  marvelCharacterOf, marvelSameCharacter,
} from '@/lib/marvel'
import { getMarvelPrices } from '@/lib/marvel-prices.server'
import { getMergedCard, getMergedCards } from '@/lib/marvel-variants.server'
import TiltCard from '@/components/TiltCard'
import ShareButton from '@/components/ShareButton'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = await getMergedCard(id)
  if (!card) return { title: 'ไม่พบการ์ด | Marvel Hero Rush Thailand' }
  return { title: `${cleanMarvelName(card.name)} (${card.cardNo}) · ราคากลาง | Marvel Hero Rush Thailand` }
}

export default async function MarvelCardDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = await getMergedCard(id)
  if (!card) notFound()

  const [prices, allCards] = await Promise.all([getMarvelPrices(), getMergedCards()])
  const price = prices[card.id]
  const rar = RARITY_META[card.rarity]
  const set = marvelSets.find((s) => s.id === card.series)
  const attr = card.attribute ? ATTR_META[card.attribute] : null
  const features = (card.feature || '').split('/').map((f) => f.trim()).filter(Boolean)
  // other printings/rarities of the same card number
  const variants = allCards.filter((c) => c.cardNo === card.cardNo && c.id !== card.id)
  const character = marvelCharacterOf(card.name)
  // other cards of the same character, excluding the variants already shown
  const variantIds = new Set(variants.map((v) => v.id))
  const sameChar = marvelSameCharacter(card, 20).filter((c) => !variantIds.has(c.id)).slice(0, 12)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted mb-5">
          <Link href="/card/marvel" className="hover:text-cosmic">Marvel Hero Rush</Link>
          <span>/</span>
          {set && <Link href={`/set/marvel/${set.id}`} className="hover:text-cosmic">{set.code}</Link>}
          <span>/</span>
          <span className="text-body">{card.cardNo}</span>
        </div>

        <div className="grid md:grid-cols-[minmax(0,340px)_1fr] gap-8">
          {/* image */}
          <div>
            <div className="sticky top-20">
              <TiltCard holo={RARITY_ORDER.indexOf(card.rarity as typeof RARITY_ORDER[number]) >= RARITY_ORDER.indexOf('SR')} max={12} className="rounded-2xl">
                <div className="rounded-2xl overflow-hidden border border-line-soft" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.image} alt={cleanMarvelName(card.name)} className="w-full block" />
                </div>
              </TiltCard>
              <p className="text-center text-[11px] text-faint mt-3">เลื่อนเมาส์บนการ์ดเพื่อดูเอฟเฟกต์ 3D ✨</p>
            </div>
          </div>

          {/* info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`rarity-chip text-xs px-2 py-0.5 rounded border ${rar?.cls || ''}`}>{card.rarity} · {rar?.label}</span>
              {attr && <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${attr.cls}`}>
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 align-middle ${attr.dot}`} />{card.attribute}</span>}
              <span className="text-xs font-semibold px-2 py-0.5 rounded border border-line text-muted capitalize">{card.cardType}</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl font-extrabold text-hero leading-tight">{cleanMarvelName(card.name)}</h1>
                <p className="text-sm text-muted mt-1">{card.cardNo} · {set?.name}</p>
              </div>
              <ShareButton title={`${cleanMarvelName(card.name)} · Vaultverse`} />
            </div>

            {/* PRICE */}
            <div className="mv-panel rounded-2xl p-5 mt-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-muted mb-1">ราคากลางโดยสมาคม</div>
                  <div className={`font-display text-4xl font-extrabold ${price != null ? 'text-gold-bright' : 'text-faint'}`}>
                    {formatTHB(price)}
                  </div>
                </div>
                <div className="text-right">
                  {price != null ? (
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-gold/15 text-gold-bright border border-gold/30">ตั้งโดยทีมงาน</span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-muted border border-line">รอตั้งราคา</span>
                  )}
                </div>
              </div>
            </div>

            {/* stats */}
            {card.cardType === 'character' && (
              <div className="grid grid-cols-3 gap-3 mt-5">
                <StatBox label="เลเวล" value={card.level ?? '—'} />
                <StatBox label="พลัง" value={card.power?.toLocaleString() ?? '—'} accent />
                <StatBox label="ระยะโจมตี" value={card.attackRange ?? '—'} />
              </div>
            )}

            {/* features */}
            {features.length > 0 && (
              <div className="mt-5">
                <div className="text-xs font-semibold text-muted mb-2">แท็ก</div>
                <div className="flex flex-wrap gap-1.5">
                  {features.map((f) => (
                    <span key={f} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-cosmic/10 text-cosmic border border-cosmic/25">{f}</span>
                  ))}
                </div>
              </div>
            )}

            {/* effect */}
            {card.effect && (
              <div className="mt-5">
                <div className="text-xs font-semibold text-muted mb-2">เอฟเฟกต์</div>
                <div className="mv-panel rounded-xl p-4 text-sm text-body leading-relaxed whitespace-pre-line">{card.effect}</div>
              </div>
            )}

            {/* variants */}
            {variants.length > 0 && (
              <div className="mt-6">
                <div className="text-xs font-semibold text-muted mb-2">เวอร์ชันอื่นของการ์ดใบนี้</div>
                <div className="flex gap-3 flex-wrap">
                  {variants.map((v) => (
                    <Link key={v.id} href={`/card/marvel/${v.id}`} className="mv-card rounded-lg overflow-hidden w-24 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.image} alt={v.rarity} className="w-full aspect-[63/88] object-cover" loading="lazy" />
                      <div className="text-center text-[10px] font-bold py-1 text-body group-hover:text-hero">{v.rarity}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* same character */}
        {sameChar.length > 0 && (
          <div className="mt-14">
            <div className="section-eyebrow mb-1">More {character}</div>
            <h2 className="section-title neon-title text-2xl sm:text-3xl font-extrabold mb-5">การ์ด {character} ใบอื่น</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {sameChar.map((c) => {
                const rr = RARITY_META[c.rarity]
                return (
                  <Link key={c.id} href={`/card/marvel/${c.id}`} className="mv-card rounded-xl overflow-hidden group">
                    <div className="relative aspect-[63/88] bg-abyss">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.image} alt={cleanMarvelName(c.name)} className="w-full h-full object-cover" loading="lazy" />
                      <span className={`absolute top-1.5 right-1.5 rarity-chip text-[10px] px-1.5 py-0.5 rounded border ${rr?.cls || ''}`}>{c.rarity}</span>
                    </div>
                    <div className="p-2">
                      <div className="text-[11px] font-semibold text-body truncate group-hover:text-hero transition-colors">{cleanMarvelName(c.name)}</div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-faint">{c.cardNo}</span>
                        <span className={`text-[11px] font-bold ${prices[c.id] != null ? 'text-gold-bright' : 'text-faint'}`}>{formatTHB(prices[c.id])}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="mv-card rounded-xl p-3 text-center">
      <div className="text-[11px] text-muted mb-1">{label}</div>
      <div className={`font-display text-xl font-extrabold ${accent ? 'text-marvel-bright' : 'text-hero'}`}>{value}</div>
    </div>
  )
}
