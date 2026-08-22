import Navbar from '@/components/Navbar'
import MarvelBrowser from '@/components/MarvelBrowser'
import { marvelSets, MARVEL } from '@/lib/marvel'
import { getMarvelPrices } from '@/lib/marvel-prices.server'
import { getMergedCards } from '@/lib/marvel-variants.server'
import { getServerT } from '@/lib/i18n.server'

export const metadata = {
  title: 'การ์ดทั้งหมด · Marvel Hero Rush | Marvel Hero Rush Thailand',
  description: 'เรียกดูการ์ด Marvel Hero Rush ครบทุกใบ พร้อมราคากลาง',
}

export default async function MarvelCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; attr?: string; series?: string }>
}) {
  const [prices, sp, cards, { t }] = await Promise.all([getMarvelPrices(), searchParams, getMergedCards(), getServerT()])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* header */}
        <div className="text-center mb-8">
          <div className="section-eyebrow mb-2">{t('mhr.browse.eyebrow')}</div>
          <h2 className="section-title neon-title text-4xl sm:text-5xl font-extrabold">{t('mhr.browse.title')}</h2>
          <p className="text-sm text-muted mt-3">
            {t('mhr.browse.countPrefix')} {cards.length} {t('mhr.browse.countMid')} {marvelSets.length} {t('mhr.browse.countSuffix')} {MARVEL.updatedAt}
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
