'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useT } from '@/lib/i18n'

type Game = 'pokemon' | 'pokemon-jp' | 'onepiece'

interface SetInfo {
  id: string
  name: string
  series?: string
  totalCards?: number
  cardCount?: number
  releaseDate?: string
  images?: { symbol?: string; logo?: string }
  logo?: string
}

interface CardInfo {
  id: string
  name: string
  number?: string
  localId?: string
  image?: string | null
  imageLarge?: string | null
  rarity?: string | null
  hp?: string | number | null
  types?: string[]
  supertype?: string
  category?: string | null
  tcgplayer?: { url?: string; prices?: any } | null
}

const GAME_CONFIG: Record<Game, { label: string; linkPrefix: string }> = {
  pokemon: { label: 'Pokemon EN', linkPrefix: '/card/pokemon' },
  'pokemon-jp': { label: 'Pokemon JP', linkPrefix: '/card/pokemon-jp' },
  onepiece: { label: 'One Piece', linkPrefix: '/card/onepiece' },
}

export default function SetDetailPage() {
  const t = useT()
  const params = useParams()
  const game = params.game as Game
  const setId = params.setId as string

  const [set, setSet] = useState<SetInfo | null>(null)
  const [cards, setCards] = useState<CardInfo[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [rarityFilter, setRarityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const pageSize = 50

  useEffect(() => {
    fetchSetCards(1)
  }, [game, setId])

  async function fetchSetCards(p: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/sets/${game}/${encodeURIComponent(setId)}?page=${p}&pageSize=${pageSize}`)
      const data = await res.json()
      if (p === 1) {
        setSet(data.set || null)
        setCards(data.data || [])
      } else {
        setCards(prev => [...prev, ...(data.data || [])])
      }
      setTotalCount(data.totalCount || 0)
      setPage(p)
    } catch (err) {
      console.error('Failed to fetch set cards:', err)
    }
    setLoading(false)
  }

  const rarities = [...new Set(cards.map(c => c.rarity).filter(Boolean))] as string[]
  const types = [...new Set(cards.flatMap(c => c.types || []))] as string[]

  const filtered = cards.filter(c => {
    if (rarityFilter !== 'all' && c.rarity !== rarityFilter) return false
    if (typeFilter !== 'all' && !(c.types || []).includes(typeFilter)) return false
    return true
  })

  const config = GAME_CONFIG[game] || GAME_CONFIG.pokemon

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#8b8fa6] mb-4">
          <Link href="/sets" className="hover:text-[#6366f1] transition-colors">{t('nav.sets') || 'Sets'}</Link>
          <span>/</span>
          <span className="text-[#5c6078]">{config.label}</span>
          <span>/</span>
          <span className="text-[#1e2235] font-medium">{set?.name || setId}</span>
        </div>

        {/* Set Header */}
        {set && (
          <div className="bg-white border border-[#e8eaf0] rounded-2xl p-6 mb-6 flex items-center gap-6">
            {(set.images?.logo || set.logo) && (
              <img
                src={(set.images?.logo || set.logo || '')}
                alt={set.name}
                className="w-24 h-24 object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-[#1e2235]">{set.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-[#5c6078]">
                {set.series && <span className="bg-[#6366f1]/10 text-[#6366f1] px-2.5 py-0.5 rounded-full text-xs font-medium">{set.series}</span>}
                <span>{(set.totalCards || set.cardCount || totalCount).toLocaleString()} cards</span>
                {set.releaseDate && <span>· {t('card.released') || 'Released'} {set.releaseDate}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {rarities.length > 1 && (
            <select
              value={rarityFilter}
              onChange={e => setRarityFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#e8eaf0] bg-white text-sm text-[#1e2235] focus:outline-none focus:border-[#6366f1]"
            >
              <option value="all">{t('set.allRarities') || 'All Rarities'}</option>
              {rarities.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}
          {types.length > 1 && (
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#e8eaf0] bg-white text-sm text-[#1e2235] focus:outline-none focus:border-[#6366f1]"
            >
              <option value="all">{t('set.allTypes') || 'All Types'}</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          )}
          <span className="text-sm text-[#8b8fa6]">
            {t('set.showing') || 'Showing'} {filtered.length} / {totalCount}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6366f1] border-t-transparent" />
          </div>
        )}

        {/* Card Grid */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map(card => (
              <Link
                key={card.id}
                href={`${config.linkPrefix}/${encodeURIComponent(card.id)}`}
                className="group bg-white rounded-xl overflow-hidden border border-transparent hover:border-[#6366f1]/20 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all"
              >
                <div className="aspect-[2.5/3.5] bg-[#f5f6fa] flex items-center justify-center overflow-hidden">
                  {(card.imageLarge || card.image) ? (
                    <img
                      src={card.imageLarge || card.image || ''}
                      alt={card.name}
                      className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-[#b5b8c8] text-center px-2">
                      <div className="text-2xl mb-1">🃏</div>
                      <div className="text-xs">{t('common.noImage') || 'No image'}</div>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-[#1e2235] truncate leading-tight">{card.name}</h3>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#8b8fa6]">
                    <span>#{card.number || card.localId || '?'}</span>
                    {card.rarity && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[80px]">{card.rarity}</span>
                      </>
                    )}
                  </div>
                  {card.hp && (
                    <span className="mt-1 inline-block bg-red-50 text-red-500 px-1.5 py-0.5 rounded text-[10px] font-medium">
                      HP {card.hp}
                    </span>
                  )}
                  {card.types && card.types.length > 0 && (
                    <div className="mt-1 flex gap-1 flex-wrap">
                      {card.types.slice(0, 3).map(type => (
                        <span key={type} className="text-[10px] bg-[#f5f6fa] px-1.5 py-0.5 rounded text-[#5c6078]">{type}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load more */}
        {!loading && cards.length < totalCount && (
          <div className="text-center mt-8">
            <button
              onClick={() => fetchSetCards(page + 1)}
              disabled={loading}
              className="px-6 py-2.5 bg-white border border-[#e8eaf0] text-[#5c6078] rounded-full hover:border-[#6366f1]/30 hover:text-[#6366f1] transition-all text-sm font-medium disabled:opacity-50"
            >
              {t('set.loadMore') || 'Load more'} ({totalCount - cards.length})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}