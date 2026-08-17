import Navbar from '@/components/Navbar'
import MarvelBrowser from '@/components/MarvelBrowser'
import { marvelCards, marvelSets, MARVEL } from '@/lib/marvel'
import { getMarvelPrices } from '@/lib/marvel-prices.server'

export const metadata = {
  title: 'การ์ดทั้งหมด · Marvel Hero Rush | Vaultverse',
  description: 'เรียกดูการ์ด Marvel Hero Rush ครบทุกใบ พร้อมราคากลางอย่างเป็นทางการ',
}

export default async function MarvelCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; attr?: string; series?: string }>
}) {
  const [prices, sp] = await Promise.all([getMarvelPrices(), searchParams])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* header */}
        <div className="text-center mb-8">
          <div className="section-eyebrow mb-2">Marvel Hero Rush · Official TH</div>
          <h2 className="section-title neon-title text-4xl sm:text-5xl font-extrabold">การ์ดทั้งหมด</h2>
          <p className="text-sm text-muted mt-3">
            ราคากลางครบ {MARVEL.total} ใบจาก {marvelSets.length} เซ็ต · อัปเดตล่าสุด {MARVEL.updatedAt}
          </p>
        </div>

        <MarvelBrowser
          cards={marvelCards}
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
