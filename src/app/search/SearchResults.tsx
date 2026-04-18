'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { PokemonCard as PokemonCardType } from '@/lib/types'
import { OnePieceCardData } from '@/lib/onepiece-api'
import { PokemonJPCardData } from '@/lib/pokemon-jp-api'
import { getCardPrice, GAME_LABELS } from '@/lib/api'
import { useExchangeRates } from '@/lib/useExchangeRates'
import Navbar from '@/components/Navbar'
import SearchBar from '@/components/SearchBar'
import { useT } from '@/lib/i18n'

function buildENKeywords(card: PokemonCardType): string[] {
  const keywords = new Set<string>()
  if (card.name) card.name.toLowerCase().split(/\s+/).forEach(w => { if (w.length >= 2) keywords.add(w) })
  if (card.types) card.types.forEach(t => keywords.add(t.toLowerCase()))
  if (card.supertype) keywords.add(card.supertype.toLowerCase())
  if (card.subtypes) card.subtypes.forEach(s => keywords.add(s.toLowerCase()))
  if (card.rarity) card.rarity.toLowerCase().split(/\s+/).forEach(w => { if (w.length >= 2) keywords.add(w) })
  if (card.set?.name) card.set.name.toLowerCase().split(/\s+/).forEach(w => { if (w.length >= 3) keywords.add(w) })
  keywords.add('pokemon')
  keywords.add('card')
  return Array.from(keywords)
}

function buildOPKeywords(card: OnePieceCardData): string[] {
  const keywords = new Set<string>()
  if (card.name) card.name.toLowerCase().split(/\s+/).forEach(w => { if (w.length >= 2) keywords.add(w) })
  if (card.type) keywords.add(card.type.toLowerCase())
  if (card.color) keywords.add(card.color.toLowerCase())
  if (card.attribute) card.attribute.toLowerCase().split(/\s+/).forEach(w => keywords.add(w))
  if (card.family) card.family.toLowerCase().split(/\s+/).forEach(w => { if (w.length >= 2) keywords.add(w) })
  if (card.rarity) card.rarity.toLowerCase().split(/\s+/).forEach(w => { if (w.length >= 2) keywords.add(w) })
  keywords.add('onepiece')
  keywords.add('card')
  return Array.from(keywords)
}

type DisplayCard = {
  id: string
  name: string
  image: string
  imageLarge: string
  setName: string
  rarity: string | null
  types: string[]
  hp: string | null
  artist: string | null
  marketPrice: number | null
  lowPrice: number | null
  midPrice: number | null
  highPrice: number | null
  game: 'pokemon' | 'onepiece'
  number: string
  color: string | null
  cost: string | null
  power: string | null
  counter: string | null
  attribute: string | null
  family: string | null
  ability: string | null
  cardType: string | null
  keywords: string[]
}

export default function SearchResults() {
  const t = useT()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const game = (searchParams.get('game') || 'pokemon') as 'pokemon' | 'onepiece'
  const pokeLang = searchParams.get('pokeLang') || 'en'
  const opLang = searchParams.get('lang') || 'en'
  const opType = searchParams.get('type') || 'all'
  const pokeSupertype = searchParams.get('supertype') || 'all'
  const pokeSubtype = searchParams.get('subtype') || 'all'
  const pokeSeries = searchParams.get('series') || 'all'
  const pokeRarity = searchParams.get('rarity') || 'all'
  const opRarity = searchParams.get('rarity') || 'all'
  const jpEvolution = searchParams.get('jpEvolution') || 'all'
  const jpType = searchParams.get('jpType') || 'all'
  const jpRarity = searchParams.get('jpRarity') || 'all'

  const [cards, setCards] = useState<DisplayCard[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedCard, setSelectedCard] = useState<DisplayCard | null>(null)
  const [priceMap, setPriceMap] = useState<Record<string, number>>({})
  const [showTHB, setShowTHB] = useState(false)

  const { formatUSD, formatTHB, toTHB } = useExchangeRates()

  const fmtPrice = (usd: number | null | undefined): string => {
    if (usd === null || usd === undefined) return ''
    if (showTHB) return formatTHB(toTHB(usd))
    return formatUSD(usd)
  }

  const fetchPokemonCards = async (q: string, p: number) => {
    if (pokeLang === 'jp') {
      const res = await fetch(`/api/cards/pokemon-jp?q=${encodeURIComponent(q)}&page=${p}&lang=jp`)
      return res.json()
    }
    const params = new URLSearchParams({ q, page: p.toString(), pageSize: '20' })
    if (pokeSupertype !== 'all') params.set('supertype', pokeSupertype)
    if (pokeSubtype !== 'all') params.set('subtype', pokeSubtype)
    if (pokeSeries !== 'all') params.set('series', pokeSeries)
    if (pokeRarity !== 'all') params.set('rarity', pokeRarity)
    const res = await fetch(`/api/cards/pokemon?${params.toString()}`)
    return res.json()
  }

  const fetchOnePieceCards = async (q: string, p: number) => {
    const res = await fetch(`/api/cards/onepiece?q=${encodeURIComponent(q)}&page=${p}&pageSize=20&lang=${opLang}&type=${opType}${opRarity !== 'all' ? `&rarity=${opRarity}` : ''}`)
    return res.json()
  }

  const fetchPrices = async (cards: DisplayCard[], game: string) => {
    const priceMap: Record<string, any> = {}
    try {
      const uniqueNames = [...new Set(cards.map(c => c.name))].slice(0, 10)
      for (const name of uniqueNames) {
        try {
          const res = await fetch(`/api/prices?q=${encodeURIComponent(name)}&game=${game}&pageSize=5`)
          if (!res.ok) continue
          const data = await res.json()
          const match = (data.data || []).find((c: any) => c.name?.toLowerCase() === name.toLowerCase()) || (data.data || [])[0]
          if (match) {
            priceMap[name.toLowerCase()] = {
              market: match.prices?.nearMint?.market ?? null,
              low: match.prices?.nearMint?.low ?? null,
              mid: match.prices?.nearMint?.mid ?? null,
              high: match.prices?.nearMint?.high ?? null,
            }
          }
          await new Promise(r => setTimeout(r, 300))
        } catch { continue }
      }
      return priceMap
    } catch { return {} }
  }

  const fetchCards = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const fetcher = game === 'pokemon' ? fetchPokemonCards : fetchOnePieceCards
      const data = await fetcher(query, page)

      if (game === 'pokemon') {
        let mapped: DisplayCard[]
        if (pokeLang === 'jp') {
          mapped = (data.data || []).map((card: PokemonJPCardData) => ({
            id: card.id, name: card.name, image: card.image, imageLarge: card.image,
            setName: card.setName, rarity: card.rarity || null, types: card.types || [],
            hp: card.hp || null, artist: null, marketPrice: null, lowPrice: null,
            midPrice: null, highPrice: null, game: 'pokemon' as const, number: card.number,
            color: null, cost: null, power: null, counter: null, attribute: null,
            family: null, ability: card.skills?.map(s => `${s.name}${s.damage ? ': ' + s.damage : ''}`).join(' | ') || null,
            cardType: card.evolution || null, keywords: card.keywords || [],
          }))
        } else {
          mapped = (data.data || []).map((card: PokemonCardType) => {
            const prices = getCardPrice(card)
            return {
              id: card.id, name: card.name, image: card.images.small, imageLarge: card.images.large,
              setName: card.set.name, rarity: card.rarity || null, types: card.types || [],
              hp: card.hp || null, artist: card.artist || null,
              marketPrice: prices?.market ?? null, lowPrice: prices?.low ?? null,
              midPrice: prices?.mid ?? null, highPrice: prices?.high ?? null,
              game: 'pokemon' as const, number: card.number, color: null, cost: null,
              power: null, counter: null, attribute: null, family: null, ability: null,
              cardType: null, keywords: buildENKeywords(card),
            }
          })
        }
        if (pokeLang === 'jp') {
          if (jpEvolution !== 'all') mapped = mapped.filter(c => c.cardType?.toLowerCase() === jpEvolution.toLowerCase())
          if (jpType !== 'all') mapped = mapped.filter(c => c.types?.some(t => t.toLowerCase() === jpType.toLowerCase()))
          if (jpRarity !== 'all') mapped = mapped.filter(c => c.rarity?.toLowerCase().includes(jpRarity.toLowerCase()))
        }
        if (page === 1) setCards(mapped); else setCards(prev => [...prev, ...mapped])
        setTotalCount(data.totalCount || 0)
      } else {
        const mapped: DisplayCard[] = (data.data || []).map((card: OnePieceCardData) => ({
          id: card.id, name: card.name, image: card.image || '', imageLarge: card.image || '',
          setName: card.setName || '', rarity: card.rarity || card.category || null, types: [],
          hp: card.power || null, artist: null, marketPrice: null, lowPrice: null,
          midPrice: null, highPrice: null, game: 'onepiece' as const, number: card.code,
          color: card.color || null, cost: card.cost || null, power: card.power || null,
          counter: card.counter || null, attribute: card.attribute || null,
          family: card.family || null, ability: card.ability || null, cardType: card.type || null,
          keywords: buildOPKeywords(card),
        }))
        // Client-side keyword filter for One Piece (Bandai search is too broad)
        const q = query.toLowerCase().trim()
        const filtered = mapped.filter(card => {
          const searchFields = [
            card.name, card.family, card.attribute, card.cardType,
            card.color, card.ability, card.rarity, card.setName,
            ...card.keywords,
          ].filter(Boolean).map(s => s!.toLowerCase())
          const searchText = searchFields.join(' ')
          const tokens = q.split(/\s+/).filter(t => t.length >= 2)
          return tokens.length === 0 || tokens.some(token => searchText.includes(token))
        })
        if (page === 1) setCards(filtered); else setCards(prev => [...prev, ...filtered])
        setTotalCount(data.totalCount || 0)

        const priceGame = game === 'onepiece' ? 'onepiece' : game === 'pokemon' && pokeLang === 'jp' ? 'pokemon-jp' : null
        if (mapped.length > 0 && priceGame) {
          const prices = await fetchPrices(mapped, priceGame)
          if (Object.keys(prices).length > 0) {
            setCards(prev => prev.map(c => {
              const p = prices[c.name.toLowerCase()]
              if (p && !c.marketPrice) return { ...c, marketPrice: p.market, lowPrice: p.low, midPrice: p.mid, highPrice: p.high }
              return c
            }))
            setPriceMap(prices as any)
          }
        }
      }
    } catch (err) { console.error('Search error:', err) }
    finally { setLoading(false) }
  }, [query, page, game, pokeLang, opLang, opType, opRarity, pokeSupertype, pokeSubtype, pokeSeries, pokeRarity, jpEvolution, jpType, jpRarity])

  useEffect(() => { setPage(1); setCards([]); fetchCards() }, [query, game, pokeLang, opLang, opType, opRarity, pokeSupertype, pokeSubtype, pokeSeries, pokeRarity, jpEvolution, jpType, jpRarity])
  useEffect(() => { if (page > 1) fetchCards() }, [page])

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search area */}
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Results header */}
        {query && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[#8b8fa6]">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
                  {t('search.searching') || 'Searching...'}
                </span>
              ) : (
                <>
                  <span className="text-[#1e2235] font-semibold">{totalCount.toLocaleString()}</span>{' '}
                  {t('search.results') || 'results'} &ldquo;{query}&rdquo;
                </>
              )}
            </p>
            <button
              onClick={() => setShowTHB(!showTHB)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e8eaf0] rounded-lg text-xs font-medium transition-all hover:border-[#6366f1]/30"
            >
              <span className={showTHB ? 'text-[#8b8fa6]' : 'text-[#6366f1]'}>$</span>
              <span className="text-[#b5b8c8]">/</span>
              <span className={showTHB ? 'text-[#6366f1]' : 'text-[#8b8fa6]'}>฿</span>
            </button>
          </div>
        )}

        {/* Card grid - minimal */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {cards.map((card) => (
            <a
              key={card.id}
              href={card.game === 'pokemon'
                ? (pokeLang === 'jp' ? `/card/pokemon-jp/${card.id}` : `/card/pokemon/${card.id}`)
                : `/card/onepiece/${encodeURIComponent(card.name)}`}
              className="group bg-white rounded-xl overflow-hidden border border-transparent hover:border-[#6366f1]/20 hover:shadow-md hover:shadow-[#6366f1]/5 transition-all duration-200"
            >
              {/* Image */}
              <div className="aspect-[2.5/3.5] relative overflow-hidden bg-[#f5f6fa]">
                {card.image ? (
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#b5b8c8]">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                    <span className="text-[10px] mt-1">{t('common.noImage') || 'No image'}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-[#1e2235] truncate leading-tight">{card.name}</h3>
                <p className="text-xs text-[#8b8fa6] truncate mt-0.5">{card.setName}</p>
                {card.marketPrice ? (
                  <p className="text-sm font-semibold text-[#6366f1] mt-1.5">{fmtPrice(card.marketPrice)}</p>
                ) : card.game === 'onepiece' && card.cost ? (
                  <p className="text-xs text-[#8b8fa6] mt-1.5">Cost {card.cost}{card.power ? ` · ${card.power}` : ''}</p>
                ) : null}
              </div>
            </a>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && cards.length === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[2.5/3.5] bg-[#f0f1f3]" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-[#f0f1f3] rounded w-3/4" />
                  <div className="h-3 bg-[#f0f1f3] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {!loading && cards.length > 0 && cards.length < totalCount && (
          <div className="text-center mt-8">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-6 py-2.5 bg-white border border-[#e8eaf0] text-[#5c6078] rounded-full hover:border-[#6366f1]/30 hover:text-[#6366f1] transition-all text-sm font-medium"
            >
              {t('search.loadMore') || 'Load more'}
            </button>
          </div>
        )}

        {/* No results */}
        {!loading && query && cards.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">🔍</div>
            <p className="text-[#5c6078] text-lg font-medium">
              {t('search.noResults') || 'No results'} &ldquo;{query}&rdquo;
            </p>
            <p className="text-[#8b8fa6] text-sm mt-1">
              {t('search.tryDifferent') || 'Try a different search'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}