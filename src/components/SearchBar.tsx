'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CardGame } from '@/lib/types'
import { GAME_LABELS } from '@/lib/api'
import { OP_CARD_TYPES, OP_RARITIES } from '@/lib/onepiece-api'

type PokemonLang = 'en' | 'jp'
type OnePieceLang = 'en' | 'jp'

// Pokemon supertypes
const POKEMON_SUPERTYPES: Record<string, string> = {
  all: 'All Types',
  Pokemon: 'Pokemon',
  Trainer: 'Trainer',
  Energy: 'Energy',
}

// Pokemon subtypes
const POKEMON_SUBTYPES: Record<string, string> = {
  all: 'All',
  'vmax': 'VMAX',
  'v': 'V',
  'vstar': 'VSTAR',
  'ex': 'EX',
  'gx': 'GX',
  'mega': 'Mega',
  'break': 'BREAK',
  'fusion': 'Fusion',
}

// Pokemon series
const POKEMON_SERIES: Record<string, string> = {
  all: 'All Series',
  'scarlet-violet': 'Scarlet & Violet',
  'sword-shield': 'Sword & Shield',
  'sun-moon': 'Sun & Moon',
  'xy': 'XY',
  'black-white': 'Black & White',
}

// Pokemon rarities (EN API)
const POKEMON_RARITIES: Record<string, string> = {
  all: 'All Rarities',
  Common: 'Common',
  Uncommon: 'Uncommon',
  Rare: 'Rare',
  'Rare Holo': 'Holo Rare',
  'Rare Ultra': 'Ultra Rare',
  'Rare Secret': 'Secret Rare',
  'Rare Rainbow': 'Rainbow',
  'Rare Alt': 'Alt Art',
  'Amazing Rare': 'Amazing',
  Promo: 'Promo',
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Record<string, string>
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[var(--surface-1)] border border-[var(--card-border)] text-gray-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all cursor-pointer hover:border-gray-500 appearance-none min-w-[120px]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239ca3af' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          paddingRight: '30px',
        }}
      >
        {Object.entries(options).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}

function LangToggle({
  value,
  onChange,
  options,
}: {
  value: 'en' | 'jp'
  onChange: (v: 'en' | 'jp') => void
  options?: { en: string; jp: string }
}) {
  const labels = options || { en: 'EN', jp: 'JP' }
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
        Lang
      </label>
      <div className="flex gap-1">
        {([['en', labels.en], ['jp', labels.jp]] as [['en' | 'jp', string], ['en' | 'jp', string]]).map(([lang, label]) => (
          <button
            key={lang}
            type="button"
            onClick={() => onChange(lang)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              value === lang
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-[var(--surface-1)] text-gray-400 hover:text-gray-200 border border-[var(--card-border)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [game, setGame] = useState<CardGame>('pokemon')
  const [pokeLang, setPokeLang] = useState<PokemonLang>('en')
  const [opLang, setOpLang] = useState<OnePieceLang>('en')
  const [opType, setOpType] = useState('all')
  const [opRarity, setOpRarity] = useState('all')
  const [pokeSupertype, setPokeSupertype] = useState('all')
  const [pokeSubtype, setPokeSubtype] = useState('all')
  const [pokeSeries, setPokeSeries] = useState('all')
  const [pokeRarity, setPokeRarity] = useState('all')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    const params = new URLSearchParams({
      q: query.trim(),
      game,
    })
    if (game === 'onepiece') {
      params.set('lang', opLang)
      params.set('type', opType)
      if (opRarity !== 'all') params.set('rarity', opRarity)
    } else {
      // Pokemon: EN uses API, JP uses scraping
      params.set('pokeLang', pokeLang)
      if (pokeLang === 'en') {
        // EN filters (Pokemon TCG API)
        if (pokeSupertype !== 'all') params.set('supertype', pokeSupertype)
        if (pokeSubtype !== 'all') params.set('subtype', pokeSubtype)
        if (pokeSeries !== 'all') params.set('series', pokeSeries)
        if (pokeRarity !== 'all') params.set('rarity', pokeRarity)
      }
    }
    router.push(`/search?${params.toString()}`)
  }

  const hasActiveFilters =
    game === 'onepiece'
      ? opType !== 'all' || opRarity !== 'all'
      : pokeLang === 'en'
        ? pokeSupertype !== 'all' || pokeSubtype !== 'all' || pokeSeries !== 'all' || pokeRarity !== 'all'
        : false

  const clearFilters = () => {
    if (game === 'onepiece') {
      setOpType('all')
      setOpRarity('all')
    } else {
      setPokeSupertype('all')
      setPokeSubtype('all')
      setPokeSeries('all')
      setPokeRarity('all')
    }
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto space-y-4">
      {/* Game selector */}
      <div className="flex gap-2">
        {(['pokemon', 'onepiece'] as CardGame[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGame(g)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              game === g
                ? g === 'pokemon'
                  ? 'bg-gradient-to-r from-yellow-500 to-red-500 text-white shadow-lg shadow-amber-500/25'
                  : 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-lg shadow-red-500/25'
                : 'bg-[var(--surface-1)] text-gray-400 hover:text-gray-200 border border-[var(--card-border)] hover:border-gray-500'
            }`}
          >
            {GAME_LABELS[g]}
          </button>
        ))}
      </div>

      {/* Pokemon filters */}
      {game === 'pokemon' && (
        <div className="flex flex-wrap items-center gap-3 bg-[var(--surface-1)]/50 border border-[var(--card-border)] rounded-xl px-4 py-3">
          <LangToggle value={pokeLang} onChange={setPokeLang} options={{ en: 'EN Cards', jp: 'JP Cards' }} />
          {pokeLang === 'en' && (
            <>
              <FilterSelect label="Type" value={pokeSupertype} onChange={setPokeSupertype} options={POKEMON_SUPERTYPES} />
              <FilterSelect label="Subtype" value={pokeSubtype} onChange={setPokeSubtype} options={POKEMON_SUBTYPES} />
              <FilterSelect label="Rarity" value={pokeRarity} onChange={setPokeRarity} options={POKEMON_RARITIES} />
              <FilterSelect label="Series" value={pokeSeries} onChange={setPokeSeries} options={POKEMON_SERIES} />
            </>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* One Piece filters */}
      {game === 'onepiece' && (
        <div className="flex flex-wrap items-center gap-3 bg-[var(--surface-1)]/50 border border-[var(--card-border)] rounded-xl px-4 py-3">
          <LangToggle value={opLang} onChange={setOpLang} />
          <FilterSelect label="Type" value={opType} onChange={setOpType} options={OP_CARD_TYPES} />
          <FilterSelect label="Rarity" value={opRarity} onChange={setOpRarity} options={OP_RARITIES} />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Search input */}
      <div className="flex-1 relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={game === 'pokemon' ? (pokeLang === 'jp' ? 'Pokemon (JP card art)...' : 'Pokemon cards...') : 'One Piece cards...'}
          className="w-full pl-12 pr-24 py-3.5 bg-[var(--surface-1)] border border-[var(--card-border)] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-amber-500 text-black rounded-lg text-sm font-bold hover:bg-amber-400 transition-all shadow-sm shadow-amber-500/20"
        >
          Search
        </button>
      </div>
    </form>
  )
}