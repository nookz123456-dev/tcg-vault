'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  MarvelCard, MarvelSet, RARITY_ORDER, RARITY_META, ATTR_META, ATTRIBUTES,
  cleanMarvelName, formatTHB,
} from '@/lib/marvel'
import { useT } from '@/lib/i18n'

type SortKey = 'number' | 'priceDesc' | 'priceAsc' | 'rarity' | 'power'

export default function MarvelBrowser({
  cards, sets, prices, initialSeries, initialQuery, initialAttr,
}: {
  cards: MarvelCard[]
  sets: MarvelSet[]
  prices: Record<string, number>
  initialSeries?: string
  initialQuery?: string
  initialAttr?: string
}) {
  const tt = useT()
  const [q, setQ] = useState(initialQuery || '')
  const [series, setSeries] = useState<string>(initialSeries || 'all')
  const [attr, setAttr] = useState<string>(initialAttr || 'all')
  const [rarity, setRarity] = useState<string>('all')
  const [type, setType] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('number')

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    let list = cards.filter((c) => {
      if (series !== 'all' && c.series !== series) return false
      if (attr !== 'all' && c.attribute !== attr) return false
      if (rarity !== 'all' && c.rarity !== rarity) return false
      if (type !== 'all' && c.cardType !== type) return false
      if (ql && !c.name.toLowerCase().includes(ql) && !c.cardNo.toLowerCase().includes(ql) &&
          !(c.feature || '').toLowerCase().includes(ql)) return false
      return true
    })
    const rIdx = (r: string) => RARITY_ORDER.indexOf(r as typeof RARITY_ORDER[number])
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'priceDesc': return (prices[b.id] ?? -1) - (prices[a.id] ?? -1)
        case 'priceAsc': return (prices[a.id] ?? Infinity) - (prices[b.id] ?? Infinity)
        case 'rarity': return rIdx(b.rarity) - rIdx(a.rarity)
        case 'power': return (b.power ?? -1) - (a.power ?? -1)
        default: return a.cardNo.localeCompare(b.cardNo)
      }
    })
    return list
  }, [cards, q, series, attr, rarity, type, sort, prices])

  const reset = () => { setQ(''); setSeries('all'); setAttr('all'); setRarity('all'); setType('all'); setSort('number') }
  const activeFilters = [series, attr, rarity, type].filter((v) => v !== 'all').length + (q ? 1 : 0)

  return (
    <div>
      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tt('mhr.browse.searchHero')}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface border border-line text-sm text-hero placeholder:text-faint focus:outline-none focus:border-cosmic/60"
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2.5 rounded-xl bg-surface border border-line text-sm text-body focus:outline-none focus:border-cosmic/60">
          <option value="number">{tt('mhr.browse.sortNumber')}</option>
          <option value="priceDesc">{tt('mhr.browse.sortPriceDesc')}</option>
          <option value="priceAsc">{tt('mhr.browse.sortPriceAsc')}</option>
          <option value="rarity">{tt('mhr.browse.sortRarity')}</option>
          <option value="power">{tt('mhr.browse.sortPower')}</option>
        </select>
      </div>

      {/* Filter chips */}
      <div className="space-y-2 mb-5">
        <ChipRow label={tt('mhr.browse.filterSet')}>
          <Chip active={series === 'all'} onClick={() => setSeries('all')}>{tt('mhr.browse.all')}</Chip>
          {sets.map((s) => (
            <Chip key={s.id} active={series === s.id} onClick={() => setSeries(s.id)}>{s.code}</Chip>
          ))}
        </ChipRow>
        <ChipRow label={tt('mhr.browse.filterColor')}>
          <Chip active={attr === 'all'} onClick={() => setAttr('all')}>{tt('mhr.browse.all')}</Chip>
          {ATTRIBUTES.map((a) => (
            <Chip key={a} active={attr === a} onClick={() => setAttr(a)}>
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 align-middle ${ATTR_META[a].dot}`} />{a}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow label={tt('mhr.browse.filterRarity')}>
          <Chip active={rarity === 'all'} onClick={() => setRarity('all')}>{tt('mhr.browse.all')}</Chip>
          {RARITY_ORDER.map((r) => (
            <Chip key={r} active={rarity === r} onClick={() => setRarity(r)}>{r}</Chip>
          ))}
        </ChipRow>
        <ChipRow label={tt('mhr.browse.filterType')}>
          <Chip active={type === 'all'} onClick={() => setType('all')}>{tt('mhr.browse.all')}</Chip>
          <Chip active={type === 'character'} onClick={() => setType('character')}>Character</Chip>
          <Chip active={type === 'impact'} onClick={() => setType('impact')}>Rush Point</Chip>
        </ChipRow>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted">{tt('mhr.browse.found')} <span className="text-hero font-bold">{filtered.length}</span> {tt('mhr.cards')}</p>
        {activeFilters > 0 && (
          <button onClick={reset} className="text-xs font-semibold text-marvel-bright hover:text-marvel">{tt('mhr.browse.clearFilters')} ({activeFilters})</button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {filtered.map((c) => (
          <MarvelTile key={c.id} card={c} price={prices[c.id]} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted">
          <div className="text-4xl mb-3">🕸️</div>
          {tt('mhr.browse.noResults')}
        </div>
      )}
    </div>
  )
}

function MarvelTile({ card, price }: { card: MarvelCard; price?: number }) {
  const rar = RARITY_META[card.rarity]
  return (
    <Link href={`/card/marvel/${card.id}`} className="mv-card rounded-xl overflow-hidden group">
      <div className="relative aspect-[63/88] bg-abyss">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.image} alt={cleanMarvelName(card.name)} className="w-full h-full object-cover" loading="lazy" />
        <span className={`absolute top-1.5 right-1.5 rarity-chip text-[10px] px-1.5 py-0.5 rounded border ${rar?.cls || ''}`}>{card.rarity}</span>
        {card.attribute && (
          <span className={`absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-black/40 ${ATTR_META[card.attribute]?.dot || ''}`} />
        )}
      </div>
      <div className="p-2">
        <div className="text-[11px] font-semibold text-body truncate group-hover:text-hero transition-colors">{cleanMarvelName(card.name)}</div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[10px] text-faint">{card.cardNo}</span>
          <span className={`text-[11px] font-bold ${price != null ? 'text-gold-bright' : 'text-faint'}`}>{formatTHB(price)}</span>
        </div>
      </div>
    </Link>
  )
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[11px] font-semibold text-faint w-10 shrink-0 pt-1.5">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
        active ? 'bg-cosmic/15 border-cosmic/50 text-hero' : 'bg-surface border-line text-muted hover:text-body hover:border-line'
      }`}
    >
      {children}
    </button>
  )
}
