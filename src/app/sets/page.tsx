'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

type Game = 'pokemon' | 'pokemon-jp' | 'onepiece'

interface SetInfo {
  id: string
  name: string
  totalCards?: number
  cardCount?: number
  releaseDate?: string
  series?: string
  images?: { symbol?: string; logo?: string }
  logo?: string
  symbol?: string
}

const GAME_CONFIG: Record<Game, { label: string; color: string; emoji: string }> = {
  pokemon: { label: 'Pokemon EN', color: 'bg-yellow-500', emoji: '⚡' },
  'pokemon-jp': { label: 'Pokemon JP', color: 'bg-indigo-500', emoji: '🗼' },
  onepiece: { label: 'One Piece', color: 'bg-red-500', emoji: '🏴‍☠️' },
}

export default function SetsPage() {
  const [game, setGame] = useState<Game>('pokemon')
  const [sets, setSets] = useState<SetInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
    fetchSets()
  }, [game])

  async function fetchSets() {
    setLoading(true)
    try {
      const res = await fetch(`/api/sets/${game}`)
      const data = await res.json()
      setSets(data.data || [])
    } catch (err) {
      console.error('Failed to fetch sets:', err)
      setSets([])
    }
    setLoading(false)
  }

  const filtered = sets.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  // Group by series/year
  const grouped = filtered.reduce((acc, set) => {
    let key: string
    if (game === 'pokemon') {
      key = set.series || 'Other'
    } else if (game === 'pokemon-jp') {
      key = set.releaseDate?.substring(0, 4) || 'Unknown'
    } else {
      const prefix = set.id.replace(/\d+$/, '')
      key = prefix.startsWith('ST') ? 'Starter Decks' : prefix.startsWith('PRB') ? 'Premium Boosters' : prefix.startsWith('EB') ? 'Enhanced Boosters' : 'Main Sets'
    }
    if (!acc[key]) acc[key] = []
    acc[key].push(set)
    return acc
  }, {} as Record<string, SetInfo[]>)

  // Sort groups
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    if (game === 'pokemon') return b.localeCompare(a) // Series descending
    return b.localeCompare(a) // Year descending
  })

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1e2235]">Card Sets</h1>
          <p className="text-[#5c6078] mt-1">Browse all sets — every card in existence</p>
        </div>

        {/* Game Tabs */}
        <div className="flex gap-2 mb-6">
          {(Object.keys(GAME_CONFIG) as Game[]).map(g => (
            <button
              key={g}
              onClick={() => setGame(g)}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${
                game === g
                  ? `${GAME_CONFIG[g].color} text-white shadow-md`
                  : 'bg-white text-[#5c6078] hover:bg-[#e8eaf0]'
              }`}
            >
              {GAME_CONFIG[g].emoji} {GAME_CONFIG[g].label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder={`Search ${GAME_CONFIG[game].label} sets...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 rounded-lg border border-[#e8eaf0] bg-white text-[#1e2235] focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            <span className="ml-3 text-[#5c6078]">Loading sets...</span>
          </div>
        )}

        {/* Sets Grid */}
        {!loading && sortedGroups.map(([group, groupSets]) => (
          <div key={group} className="mb-10">
            <h2 className="text-xl font-bold text-[#1e2235] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full" />
              {group}
              <span className="text-sm font-normal text-[#8b8fa6]">
                ({groupSets.length} sets)
              </span>
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {groupSets.map(set => (
                <Link
                  key={set.id}
                  href={`/set/${game}/${set.id}`}
                  className="bg-white rounded-xl border border-[#e8eaf0] p-4 hover:shadow-lg hover:border-indigo-300 transition-all group"
                >
                  {/* Set Image */}
                  <div className="aspect-square bg-[#f5f6fa] rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {(set.images?.logo || set.logo) ? (
                      <img
                        src={set.images?.logo || set.logo || ''}
                        alt={set.name}
                        className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <span className="text-4xl">
                        {game === 'pokemon' ? '⚡' : game === 'pokemon-jp' ? '🗼' : '🏴‍☠️'}
                      </span>
                    )}
                  </div>
                  
                  {/* Set Info */}
                  <h3 className="font-semibold text-[#1e2235] text-sm leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {set.name}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-[#8b8fa6]">
                    <span>{(set.totalCards || set.cardCount || 0).toLocaleString()} cards</span>
                    {set.releaseDate && (
                      <>
                        <span>·</span>
                        <span>{set.releaseDate.substring(0, 7)}</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-[#8b8fa6]">
            <p className="text-lg">No sets found</p>
            <p className="text-sm mt-1">Try a different search or game</p>
          </div>
        )}
      </div>
    </div>
  )
}