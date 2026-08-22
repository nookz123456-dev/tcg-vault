import Navbar from '@/components/Navbar'
import MarvelBrowser from '@/components/MarvelBrowser'
import { marvelSets, MARVEL } from '@/lib/marvel'
import { getMarvelPrices } from '@/lib/marvel-prices.server'
import { getMergedCards } from '@/lib/marvel-variants.server'

export const metadata = {
  title: 'การ์ดทั้งหมด · Marvel Hero Rush | Marvel Hero Rush Thailand',
  description: 'เรียกดูการ์ด Marvel Hero Rush ครบทุกใบ พร้อมราคากลาง',
}

export default async function MarvelCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; attr?: string; series?: string }>
}) {
  const [prices, sp, cards] = await Promise.all([getMarvelPrices(), searchParams, getMergedCards()])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* header */}
        <div className="text-center mb-8">
          <div className="section-eyebrow mb-2">Marvel Hero Rush · โดยสมาคมผู้คลั่งไคล้ SuperHero</div>
          <h2 className="section-title neon-title text-4xl sm:text-5xl font-extrabold">การ์ดทั้งหมด</h2>
          <p className="text-sm text-muted mt-3">
            ราคากลางครบ {cards.length} ใบจาก {marvelSets.length} เซ็ต · อัปเดตล่าสุด {MARVEL.updatedAt}
          </p>
        </div>

        <MarvelBrowser
          cards={cards}
          sets={marvelSets}
          prices={prices}
          initialQuery={sp.q}
          initialAttr={sp.attr}
          initialSeries={sp.series}
        />
      </div>
    </div>
  )
}
