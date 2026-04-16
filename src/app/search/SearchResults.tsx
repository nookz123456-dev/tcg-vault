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

  const [cards, setCards] = useState<DisplayCard[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedCard, setSelectedCard] = useState<DisplayCard | null>(null)
  const [addedCards, setAddedCards] = useState<Set<string>>(new Set())

  const { addCard, cards: collectionCards } = useLocalCollection()

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
      }
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [query, page, game, pokeLang, opLang, opType, opRarity, pokeSupertype, pokeSubtype, pokeSeries, pokeRarity])

  useEffect(() => {
    setPage(1)
    setCards([])
    fetchCards()
  }, [query, game, pokeLang, opLang, opType, opRarity, pokeSupertype, pokeSubtype, pokeSeries, pokeRarity])

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
            <p className="text-sm font-medium text-gray-300">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  Searching...
                </span>
              ) : (
                <>
                  <span className="text-white font-bold">{totalCount.toLocaleString()}</span> results for &quot;{query}&quot;
                </>
              )}
            </p>
            <p className="text-xs text-gray-400 font-medium">
              {GAME_LABELS[game]}{game === 'onepiece' ? ` · ${opLang === 'en' ? 'English' : 'Japanese'}` : game === 'pokemon' && pokeLang === 'jp' ? ' · JP Edition' : pokeSupertype !== 'all' ? ` · ${pokeSupertype}` : ''}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {cards.map((card) => {
            const isInCollection = addedCards.has(card.id)
            return (
              <a
                key={card.id}
                href={card.game === 'pokemon' ? `/card/pokemon/${card.id}` : undefined}
                className="group bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden card-hover text-left cursor-pointer relative transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 block"
              >
                {isInCollection && (
                  <div className="absolute top-2.5 left-2.5 z-10 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-lg font-bold shadow-sm">
                    IN COLLECTION
                  </div>
                )}
                <div className="aspect-[2.5/3.5] relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                  {card.image ? (
                    <img
                      src={card.image}
                      alt={card.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                  {card.rarity && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/70 text-[10px] text-amber-400 rounded-lg backdrop-blur-sm font-medium">
                      {card.rarity}
                    </span>
                  )}
                  {card.game === 'onepiece' && card.color && (
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-black/70 text-[10px] text-gray-200 rounded-lg backdrop-blur-sm font-medium">
                      {card.color}
                    </span>
                  )}
                </div>
                <div className="p-3.5">
                  <h3 className="text-sm font-semibold text-gray-100 truncate">{card.name}</h3>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{card.setName}</p>
                  {/* Keywords / Tags */}
                  {card.keywords && card.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {card.keywords.filter(k => !['card','pokemon','onepiece'].includes(k)).slice(0, 5).map(k => (
                        <span key={k} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400/80 text-[9px] rounded-md font-medium">{k}</span>
                      ))}
                    </div>
                  )}
                  {card.marketPrice ? (
                    <p className="text-sm font-bold text-amber-400 mt-1.5">
                      ${card.marketPrice.toFixed(2)}
                    </p>
                  ) : card.game === 'onepiece' && card.cost ? (
                    <p className="text-xs text-gray-400 mt-1.5">
                      Cost: {card.cost}{card.power ? ` · Power: ${card.power}` : ''}
                    </p>
                  ) : null}
                </div>
              </a>
            )
          })}
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 mt-4">
            {[...Array(5)].map((_, i) => (
              <div key={`shimmer-${i}`} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shimmer">
                <div className="aspect-[2.5/3.5]" />
                <div className="p-3.5 space-y-2">
                  <div className="h-4 bg-[var(--surface-2)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--surface-2)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && cards.length > 0 && cards.length < totalCount && (
          <div className="text-center mt-10">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-8 py-2.5 bg-[var(--surface-1)] border border-[var(--card-border)] text-gray-300 rounded-xl hover:text-amber-400 hover:border-amber-500/40 transition-all font-medium"
            >
              Load More
            </button>
          </div>
        )}

        {!loading && query && cards.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-50">🔍</div>
            <p className="text-gray-300 text-lg">No cards found for &quot;{query}&quot;</p>
            <p className="text-gray-500 text-sm mt-1">Try a different search term or filter</p>
          </div>
        )}

        {selectedCard && (
          <CardDetailModal
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
            onAdd={() => handleAddToCollection(selectedCard)}
            isInCollection={addedCards.has(selectedCard.id)}
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
  isInCollection
}: {
  card: DisplayCard
  onClose: () => void
  onAdd: () => void
  isInCollection: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col md:flex-row gap-6 p-6">
          <div className="flex-shrink-0 flex justify-center">
            {card.imageLarge ? (
              <img
                src={card.imageLarge}
                alt={card.name}
                className="max-w-[300px] rounded-xl shadow-lg"
              />
            ) : (
              <div className="w-[300px] h-[420px] bg-[var(--surface-1)] rounded-xl flex items-center justify-center text-gray-500">
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
              <h2 className="text-2xl font-bold text-white">{card.name}</h2>
              <p className="text-gray-400 mt-0.5">{card.setName} #{card.number}</p>
            </div>

            {/* Card details */}
            <div className="flex flex-wrap gap-2">
              {card.rarity && (
                <span className="px-2.5 py-1 bg-amber-500/15 text-amber-400 rounded-lg text-xs font-medium">{card.rarity}</span>
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
              <div className="bg-[var(--surface-1)] rounded-xl p-4 border border-[var(--card-border)]">
                <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Effect</p>
                <p className="text-sm text-gray-200 leading-relaxed">{card.ability}</p>
              </div>
            )}

            {/* Prices for Pokemon */}
            {(card.marketPrice || card.lowPrice) && (
              <div className="bg-[var(--surface-1)] rounded-xl p-4 border border-[var(--card-border)] space-y-3">
                <h3 className="text-sm font-semibold text-gray-300">Market Prices (TCGplayer)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {card.marketPrice && (
                    <div>
                      <p className="text-xs text-gray-400">Market</p>
                      <p className="text-lg font-bold text-amber-400">${card.marketPrice.toFixed(2)}</p>
                    </div>
                  )}
                  {card.lowPrice && (
                    <div>
                      <p className="text-xs text-gray-400">Low</p>
                      <p className="text-sm text-gray-200">${card.lowPrice.toFixed(2)}</p>
                    </div>
                  )}
                  {card.midPrice && (
                    <div>
                      <p className="text-xs text-gray-400">Mid</p>
                      <p className="text-sm text-gray-200">${card.midPrice.toFixed(2)}</p>
                    </div>
                  )}
                  {card.highPrice && (
                    <div>
                      <p className="text-xs text-gray-400">High</p>
                      <p className="text-sm text-gray-200">${card.highPrice.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {card.artist && (
              <p className="text-xs text-gray-400">Art by {card.artist}</p>
            )}

            <button
              onClick={onAdd}
              disabled={isInCollection}
              className={`w-full py-3 rounded-xl font-semibold transition-all text-sm ${
                isInCollection
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-default'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20'
              }`}
            >
              {isInCollection ? 'In Collection' : '+ Add to Collection'}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-[var(--surface-1)] border border-[var(--card-border)] rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}