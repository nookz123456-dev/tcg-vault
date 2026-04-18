'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
/**
 * Build searchable keywords from One Piece card
 */
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

import { PokemonCard as PokemonCardType } from '@/lib/types'
import { OnePieceCardData } from '@/lib/onepiece-api'
import { PokemonJPCardData } from '@/lib/pokemon-jp-api'
import { getCardPrice, GAME_LABELS } from '@/lib/api'
import { useLocalCollection, LocalCard } from '@/lib/useLocalCollection'
import { useExchangeRates } from '@/lib/useExchangeRates'
import Navbar from '@/components/Navbar'
import SearchBar from '@/components/SearchBar'

/**
 * Build searchable keywords from EN Pokemon TCG API card
 */
function buildENKeywords(card: PokemonCardType): string[] {
  const keywords = new Set<string>()
  // Name
  if (card.name) card.name.toLowerCase().split(/\s+/).forEach(w => { if (w.length >= 2) keywords.add(w) })
  // Types
  if (card.types) card.types.forEach(t => keywords.add(t.toLowerCase()))
  // Supertype
  if (card.supertype) keywords.add(card.supertype.toLowerCase())
  // Subtypes (ex, gx, vmax, etc.)
  if (card.subtypes) card.subtypes.forEach(s => keywords.add(s.toLowerCase()))
  // Rarity
  if (card.rarity) card.rarity.toLowerCase().split(/\s+/).forEach(w => { if (w.length >= 2) keywords.add(w) })
  // Set
  if (card.set?.name) card.set.name.toLowerCase().split(/\s+/).forEach(w => { if (w.length >= 3) keywords.add(w) })
  keywords.add('pokemon')
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
  // JP client-side filters
  const jpEvolution = searchParams.get('jpEvolution') || 'all'
  const jpType = searchParams.get('jpType') || 'all'
  const jpRarity = searchParams.get('jpRarity') || 'all'

  const [cards, setCards] = useState<DisplayCard[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedCard, setSelectedCard] = useState<DisplayCard | null>(null)
  const [addedCards, setAddedCards] = useState<Set<string>>(new Set())
  const [priceMap, setPriceMap] = useState<Record<string, number>>({})
  const [showTHB, setShowTHB] = useState(false)

  const { addCard, cards: collectionCards } = useLocalCollection()
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
    const params = new URLSearchParams({
      q,
      page: p.toString(),
      pageSize: '20',
    })
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

  // Fetch prices from TCG Price Lookup API for One Piece / Pokemon JP
  const fetchPrices = async (cards: DisplayCard[], game: string) => {
    const priceMap: Record<string, { market: number | null; low: number | null; mid: number | null; high: number | null; graded: Record<string, any> | null; conditionPrices: any | null }> = {}
    try {
      // Search price for each unique card name (deduped, max 10 to respect rate limits)
      const uniqueNames = [...new Set(cards.map(c => c.name))].slice(0, 10)
      for (const name of uniqueNames) {
        try {
          const res = await fetch(`/api/prices?q=${encodeURIComponent(name)}&game=${game}&pageSize=5`)
          if (!res.ok) continue
          const data = await res.json()
          const match = (data.data || []).find((c: { setName: string; number: string; name: string }) =>
            c.name?.toLowerCase() === name.toLowerCase()
          ) || (data.data || [])[0]
          if (match) {
            priceMap[name.toLowerCase()] = {
              market: match.prices?.nearMint?.market ?? null,
              low: match.prices?.nearMint?.low ?? null,
              mid: match.prices?.nearMint?.mid ?? null,
              high: match.prices?.nearMint?.high ?? null,
              graded: match.graded || null,
              conditionPrices: match.prices || null,
            }
          }
          // Rate limit: wait 300ms between requests
          await new Promise(r => setTimeout(r, 300))
        } catch { continue }
      }
      return priceMap
    } catch {
      return {}
    }
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
          // JP Pokemon cards from pokemon-card.com
          mapped = (data.data || []).map((card: PokemonJPCardData) => ({
            id: card.id,
            name: card.name,
            image: card.image,
            imageLarge: card.image,
            setName: card.setName,
            rarity: card.rarity || null,
            types: card.types || [],
            hp: card.hp || null,
            artist: null,
            marketPrice: null,
            lowPrice: null,
            midPrice: null,
            highPrice: null,
            game: 'pokemon' as const,
            number: card.number,
            color: null,
            cost: null,
            power: null,
            counter: null,
            attribute: null,
            family: null,
            ability: card.skills?.map(s => `${s.name}${s.damage ? ': ' + s.damage : ''}`).join(' | ') || null,
            cardType: card.evolution || null,
            keywords: card.keywords || [],
          }))
        } else {
          // EN Pokemon cards from Pokemon TCG API
          mapped = (data.data || []).map((card: PokemonCardType) => {
            const prices = getCardPrice(card)
            return {
              id: card.id,
              name: card.name,
              image: card.images.small,
              imageLarge: card.images.large,
              setName: card.set.name,
              rarity: card.rarity || null,
              types: card.types || [],
              hp: card.hp || null,
              artist: card.artist || null,
              marketPrice: prices?.market ?? null,
              lowPrice: prices?.low ?? null,
              midPrice: prices?.mid ?? null,
              highPrice: prices?.high ?? null,
              game: 'pokemon' as const,
              number: card.number,
              color: null,
              cost: null,
              power: null,
              counter: null,
              attribute: null,
              family: null,
              ability: null,
              cardType: null,
              keywords: buildENKeywords(card),
            }
          })
        }
        // Apply JP client-side filters
        if (pokeLang === 'jp') {
          if (jpEvolution !== 'all') {
            mapped = mapped.filter(c => c.cardType?.toLowerCase() === jpEvolution.toLowerCase())
          }
          if (jpType !== 'all') {
            mapped = mapped.filter(c => c.types?.some(t => t.toLowerCase() === jpType.toLowerCase()))
          }
          if (jpRarity !== 'all') {
            mapped = mapped.filter(c => c.rarity?.toLowerCase().includes(jpRarity.toLowerCase()))
          }
        }
        if (page === 1) setCards(mapped)
        else setCards(prev => [...prev, ...mapped])
        setTotalCount(data.totalCount || 0)
      } else {
        const mapped: DisplayCard[] = (data.data || []).map((card: OnePieceCardData) => ({
          id: card.id,
          name: card.name,
          image: card.image || '',
          imageLarge: card.image || '',
          setName: card.setName || '',
          rarity: card.rarity || card.category || null,
          types: [],
          hp: card.power || null,
          artist: null,
          marketPrice: null,
          lowPrice: null,
          midPrice: null,
          highPrice: null,
          game: 'onepiece' as const,
          number: card.code,
          color: card.color || null,
          cost: card.cost || null,
          power: card.power || null,
          counter: card.counter || null,
          attribute: card.attribute || null,
          family: card.family || null,
          ability: card.ability || null,
          cardType: card.type || null,
          keywords: buildOPKeywords(card),
        }))
        if (page === 1) setCards(mapped)
        else setCards(prev => [...prev, ...mapped])
        setTotalCount(data.totalCount || 0)

        // Fetch prices for One Piece / Pokemon JP from TCG Price Lookup
        const priceGame: string | null = game === 'onepiece' ? 'onepiece' : game === 'pokemon' && pokeLang === 'jp' ? 'pokemon-jp' : null
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
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [query, page, game, pokeLang, opLang, opType, opRarity, pokeSupertype, pokeSubtype, pokeSeries, pokeRarity, jpEvolution, jpType, jpRarity])

  useEffect(() => {
    setPage(1)
    setCards([])
    fetchCards()
  }, [query, game, pokeLang, opLang, opType, opRarity, pokeSupertype, pokeSubtype, pokeSeries, pokeRarity, jpEvolution, jpType, jpRarity])

  useEffect(() => {
    if (page > 1) fetchCards()
  }, [page])

  useEffect(() => {
    const inCollection = new Set(collectionCards.map(c => c.cardId))
    setAddedCards(inCollection)
  }, [collectionCards])

  const handleAddToCollection = (card: DisplayCard) => {
    const newCard: LocalCard = {
      id: crypto.randomUUID(),
      cardId: card.id,
      game: card.game,
      name: card.name,
      imageUrl: card.image,
      setName: card.setName,
      rarity: card.rarity,
      quantity: 1,
      condition: 'near_mint',
      purchasePrice: card.marketPrice ?? null,
      marketPrice: card.marketPrice ?? null,
      addedAt: new Date().toISOString(),
    }
    addCard(newCard)
    setAddedCards(prev => new Set([...prev, card.id]))
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <SearchBar />
        </div>

        {query && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-[#3b3f56]">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </span>
                ) : (
                  <>
                    <span className="text-[#1e2235] font-bold">{totalCount.toLocaleString()}</span> results for &quot;{query}&quot;
                  </>
                )}
              </p>
              <p className="text-xs text-[#5c6078] font-medium">
                {GAME_LABELS[game]}{game === 'onepiece' ? ` · ${opLang === 'en' ? 'English' : 'Japanese'}` : game === 'pokemon' && pokeLang === 'jp' ? ' · JP Edition' : pokeSupertype !== 'all' ? ` · ${pokeSupertype}` : ''}
              </p>
            </div>
            <button
              onClick={() => setShowTHB(!showTHB)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-lg text-xs font-semibold transition-all hover:border-[#6366f1]/30"
            >
              <span className={showTHB ? 'text-[#8b8fa6]' : 'text-[#6366f1]'}>$ USD</span>
              <span className="text-[#b5b8c8]">/</span>
              <span className={showTHB ? 'text-[#6366f1]' : 'text-[#8b8fa6]'}>฿ THB</span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {cards.map((card) => {
            const isInCollection = addedCards.has(card.id)
            return (
              <div
                key={card.id}
                className="group bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden card-hover text-left cursor-pointer relative transition-all duration-300 hover:border-[#6366f1]/30 hover:shadow-lg hover:shadow-[#6366f1]/5 block"
                onClick={() => setSelectedCard(card)}
              >
                {isInCollection && (
                  <div className="absolute top-2.5 left-2.5 z-10 bg-emerald-500 text-[#1e2235] text-[10px] px-2 py-0.5 rounded-lg font-bold shadow-sm">
                    IN COLLECTION
                  </div>
                )}
                <div className="aspect-[2.5/3.5] relative overflow-hidden bg-gradient-to-br from-[#f5f6fa] to-[#e8eaf0]">
                  {card.image ? (
                    <img
                      src={card.image}
                      alt={card.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#a0a3b1]">
                      <svg className="w-10 h-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                      <span className="text-xs">No Image</span>
                    </div>
                  )}
                  {card.rarity && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-white/80 text-[10px] text-[#6366f1] rounded-lg backdrop-blur-sm font-medium">
                      {card.rarity}
                    </span>
                  )}
                  {card.game === 'onepiece' && card.color && (
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-white/80 text-[10px] text-[#6366f1] rounded-lg backdrop-blur-sm font-medium">
                      {card.color}
                    </span>
                  )}
                </div>
                <div className="p-3.5">
                  <h3 className="text-sm font-semibold text-[#1e2235] truncate">{card.name}</h3>
                  {'nameJP' in card && (card as any).nameJP && (
                    <p className="text-xs text-[#8b8fa6] truncate">{(card as any).nameJP}</p>
                  )}
                  <p className="text-xs text-[#5c6078] truncate mt-0.5">{card.setName}</p>
                  {/* Keywords / Tags */}
                  {card.keywords && card.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {card.keywords.filter(k => !['card','pokemon','onepiece'].includes(k)).slice(0, 5).map(k => (
                        <span key={k} className="px-1.5 py-0.5 bg-[#6366f1]/10 text-[#6366f1]/80 text-[9px] rounded-md font-medium">{k}</span>
                      ))}
                    </div>
                  )}
                  {card.marketPrice ? (
                    <p className="text-sm font-bold text-[#6366f1] mt-1.5">
                      {fmtPrice(card.marketPrice)}
                    </p>
                  ) : card.game === 'onepiece' && card.cost ? (
                    <p className="text-xs text-[#5c6078] mt-1.5">
                      Cost: {card.cost}{card.power ? ` · Power: ${card.power}` : ''}
                    </p>
                  ) : null}
                </div>
                {/* Add to Collection button */}
                <div className="p-3.5 pt-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddToCollection(card) }}
                    disabled={isInCollection}
                    className={`w-full py-2 rounded-lg font-semibold transition-all text-xs ${
                      isInCollection
                        ? 'bg-emerald-50 text-emerald-500 border border-emerald-200 cursor-default'
                        : 'bg-[#6366f1] text-[#1e2235] hover:bg-[#4f46e5] shadow-sm'
                    }`}
                  >
                    {isInCollection ? 'Added' : '+ Add to Collection'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 mt-4">
            {[...Array(5)].map((_, i) => (
              <div key={`shimmer-${i}`} className="bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden shimmer">
                <div className="aspect-[2.5/3.5]" />
                <div className="p-3.5 space-y-2">
                  <div className="h-4 bg-[#e8eaf0] rounded w-3/4" />
                  <div className="h-3 bg-[#e8eaf0] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && cards.length > 0 && cards.length < totalCount && (
          <div className="text-center mt-10">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-8 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] text-[#3b3f56] rounded-xl hover:text-[#6366f1] hover:border-[#6366f1]/30 transition-all font-medium"
            >
              Load More
            </button>
          </div>
        )}

        {!loading && query && cards.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-50">🔍</div>
            <p className="text-[#3b3f56] text-lg">No cards found for &quot;{query}&quot;</p>
            <p className="text-[#8b8fa6] text-sm mt-1">Try a different search term or filter</p>
          </div>
        )}

        {selectedCard && (
          <CardDetailModal
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            onAdd={() => handleAddToCollection(selectedCard)}
            isInCollection={addedCards.has(selectedCard.id)}
            showTHB={showTHB}
          />
        )}
      </div>
    </div>
  )
}

function CardDetailModal({
  card,
  onClose,
  onAdd,
  isInCollection,
  showTHB
}: {
  card: DisplayCard
  onClose: () => void
  onAdd: () => void
  isInCollection: boolean
  showTHB: boolean
}) {
  const { formatUSD, formatTHB, toTHB } = useExchangeRates()
  const fmtPrice = (usd: number | null | undefined): string => {
    if (usd === null || usd === undefined) return ''
    if (showTHB) return formatTHB(toTHB(usd))
    return formatUSD(usd)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e2235]/80 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white border border-[#e8eaf0] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col md:flex-row gap-6 p-6">
          <div className="flex-shrink-0 flex justify-center">
            {card.imageLarge ? (
              <img
                src={card.imageLarge}
                alt={card.name}
                className="max-w-[300px] rounded-xl shadow-lg"
              />
            ) : (
              <div className="w-[300px] h-[420px] bg-[#f5f6fa] rounded-xl flex items-center justify-center text-[#8b8fa6]">
                No Image Available
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2.5 py-0.5 rounded-lg font-medium ${
                  card.game === 'pokemon'
                    ? 'bg-yellow-500/15 text-yellow-400'
                    : 'bg-red-500/15 text-red-400'
                }`}>
                  {GAME_LABELS[card.game]}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#1e2235]">{card.name}</h2>
              <p className="text-[#5c6078] mt-0.5">{card.setName} #{card.number}</p>
            </div>

            {/* Card details */}
            <div className="flex flex-wrap gap-2">
              {card.rarity && (
                <span className="px-2.5 py-1 bg-[#6366f1]/15 text-[#6366f1] rounded-lg text-xs font-medium">{card.rarity}</span>
              )}
              {card.hp && (
                <span className="px-2.5 py-1 bg-red-500/15 text-red-400 rounded-lg text-xs font-medium">HP {card.hp}</span>
              )}
              {card.types?.map(t => (
                <span key={t} className="px-2.5 py-1 bg-gray-700/50 rounded-lg text-xs text-gray-200 font-medium">{t}</span>
              ))}
              {card.game === 'onepiece' && (
                <>
                  {card.color && <span className="px-2.5 py-1 bg-purple-500/15 text-purple-400 rounded-lg text-xs font-medium">{card.color}</span>}
                  {card.cost && <span className="px-2.5 py-1 bg-blue-500/15 text-blue-400 rounded-lg text-xs font-medium">Cost: {card.cost}</span>}
                  {card.power && <span className="px-2.5 py-1 bg-red-500/15 text-red-400 rounded-lg text-xs font-medium">Power: {card.power}</span>}
                  {card.counter && <span className="px-2.5 py-1 bg-green-500/15 text-green-400 rounded-lg text-xs font-medium">Counter: {card.counter}</span>}
                  {card.cardType && <span className="px-2.5 py-1 bg-cyan-500/15 text-cyan-400 rounded-lg text-xs font-medium">{card.cardType}</span>}
                  {card.attribute && <span className="px-2.5 py-1 bg-orange-500/15 text-orange-400 rounded-lg text-xs font-medium">{card.attribute}</span>}
                  {card.family && <span className="px-2.5 py-1 bg-pink-500/15 text-pink-400 rounded-lg text-xs font-medium">{card.family}</span>}
                </>
              )}
            </div>

            {/* Ability for One Piece */}
            {card.ability && (
              <div className="bg-[#f5f6fa] rounded-xl p-4 border border-[#e8eaf0]">
                <p className="text-xs text-[#5c6078] mb-1.5 font-medium uppercase tracking-wider">Effect</p>
                <p className="text-sm text-gray-200 leading-relaxed">{card.ability}</p>
              </div>
            )}

            {/* Prices for Pokemon */}
            {(card.marketPrice || card.lowPrice) && (
              <div className="bg-[#f5f6fa] rounded-xl p-4 border border-[#e8eaf0] space-y-3">
                <h3 className="text-sm font-semibold text-[#3b3f56]">Market Prices (TCGplayer)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {card.marketPrice && (
                    <div>
                      <p className="text-xs text-[#5c6078]">Market</p>
                      <p className="text-lg font-bold text-[#6366f1]">{fmtPrice(card.marketPrice)}</p>
                    </div>
                  )}
                  {card.lowPrice && (
                    <div>
                      <p className="text-xs text-[#5c6078]">Low</p>
                      <p className="text-sm text-gray-200">{fmtPrice(card.lowPrice)}</p>
                    </div>
                  )}
                  {card.midPrice && (
                    <div>
                      <p className="text-xs text-[#5c6078]">Mid</p>
                      <p className="text-sm text-gray-200">{fmtPrice(card.midPrice)}</p>
                    </div>
                  )}
                  {card.highPrice && (
                    <div>
                      <p className="text-xs text-[#5c6078]">High</p>
                      <p className="text-sm text-gray-200">{fmtPrice(card.highPrice)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {card.artist && (
              <p className="text-xs text-[#5c6078]">Art by {card.artist}</p>
            )}

            <button
              onClick={onAdd}
              disabled={isInCollection}
              className={`w-full py-3 rounded-xl font-bold transition-all text-sm ${
                isInCollection
                  ? 'bg-emerald-50 text-emerald-500 border border-emerald-200 cursor-default'
                  : 'bg-[#6366f1] text-[#1e2235] hover:bg-[#4f46e5] shadow-lg shadow-[#6366f1]/20'
              }`}
            >
              {isInCollection ? 'Added' : '+ Add to Collection'}
            </button>

            <a
              href={card.game === 'pokemon'
                ? (window?.location?.search?.includes('pokeLang=jp')
                  ? `/card/pokemon-jp/${card.id}`
                  : `/card/pokemon/${card.id}`)
                : `/card/onepiece/${encodeURIComponent(card.name)}`}
              className="block w-full py-2.5 text-center text-sm text-[#5c6078] hover:text-[#6366f1] transition-colors font-medium"
            >
              View Full Details →
            </a>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-[#f5f6fa] border border-[#e8eaf0] rounded-full flex items-center justify-center text-[#5c6078] hover:text-[#1e2235] transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}