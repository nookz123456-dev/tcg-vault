'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CardGame } from '@/lib/types'
import { GAME_LABELS } from '@/lib/api'
import { OP_CARD_TYPES, OP_RARITIES } from '@/lib/onepiece-api'

type PokemonLang = 'en' | 'jp'

const POKEMON_SUPERTYPES: Record<string, string> = {
  all: 'All Types',
  Pokemon: 'Pokemon',
  Trainer: 'Trainer',
  Energy: 'Energy',
}

const POKEMON_SUBTYPES: Record<string, string> = {
  all: 'All',
  vmax: 'VMAX',
  v: 'V',
  vstar: 'VSTAR',
  ex: 'EX',
  gx: 'GX',
  mega: 'Mega',
}

const POKEMON_SERIES: Record<string, string> = {
  all: 'All Series',
  'scarlet-violet': 'Scarlet & Violet',
  'sword-shield': 'Sword & Shield',
  'sun-moon': 'Sun & Moon',
  xy: 'XY',
}

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
  Promo: 'Promo',
}

const JP_EVOLUTION: Record<string, string> = {
  all: 'All Stages',
  basic: 'Basic',
  stage1: 'Stage 1',
  stage2: 'Stage 2',
}

const JP_TYPES: Record<string, string> = {
  all: 'All Types',
  grass: 'Grass',
  fire: 'Fire',
  water: 'Water',
  lightning: 'Lightning',
  psychic: 'Psychic',
  fighting: 'Fighting',
  darkness: 'Darkness',
  metal: 'Metal',
  fairy: 'Fairy',
  dragon: 'Dragon',
  colorless: 'Colorless',
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: Record<string, string>
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white border border-[#e8eaf0] text-[#3b3f56] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/20 transition-all cursor-pointer appearance-none min-w-[110px]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='%239ca3af' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        paddingRight: '28px',
      }}
    >
      {Object.entries(options).map(([key, label]) => (
        <option key={key} value={key}>{label}</option>
      ))}
    </select>
  )
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [game, setGame] = useState<CardGame>('pokemon')
  const [pokeLang, setPokeLang] = useState<PokemonLang>('en')
  const [opLang, setOpLang] = useState<'en' | 'jp'>('en')
  const [opType, setOpType] = useState('all')
  const [opRarity, setOpRarity] = useState('all')
  const [pokeSupertype, setPokeSupertype] = useState('all')
  const [pokeSubtype, setPokeSubtype] = useState('all')
  const [pokeSeries, setPokeSeries] = useState('all')
  const [pokeRarity, setPokeRarity] = useState('all')
  const [jpEvolution, setJpEvolution] = useState('all')
  const [jpType, setJpType] = useState('all')
  const [jpRarity, setJpRarity] = useState('all')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    const params = new URLSearchParams({ q: query.trim(), game })
    if (game === 'onepiece') {
      params.set('lang', opLang)
      params.set('type', opType)
      if (opRarity !== 'all') params.set('rarity', opRarity)
    } else {
      params.set('pokeLang', pokeLang)
      if (pokeLang === 'en') {
        if (pokeSupertype !== 'all') params.set('supertype', pokeSupertype)
        if (pokeSubtype !== 'all') params.set('subtype', pokeSubtype)
        if (pokeSeries !== 'all') params.set('series', pokeSeries)
        if (pokeRarity !== 'all') params.set('rarity', pokeRarity)
      } else {
        if (jpEvolution !== 'all') params.set('jpEvolution', jpEvolution)
        if (jpType !== 'all') params.set('jpType', jpType)
        if (jpRarity !== 'all') params.set('jpRarity', jpRarity)
      }
    }
    router.push(`/search?${params.toString()}`)
  }

  const hasActiveFilters =
    game === 'onepiece'
      ? opType !== 'all' || opRarity !== 'all'
      : pokeLang === 'en'
        ? pokeSupertype !== 'all' || pokeSubtype !== 'all' || pokeSeries !== 'all' || pokeRarity !== 'all'
        : jpEvolution !== 'all' || jpType !== 'all' || jpRarity !== 'all'

  const clearFilters = () => {
    if (game === 'onepiece') { setOpType('all'); setOpRarity('all') }
    else if (pokeLang === 'en') { setPokeSupertype('all'); setPokeSubtype('all'); setPokeSeries('all'); setPokeRarity('all') }
    else { setJpEvolution('all'); setJpType('all'); setJpRarity('all') }
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto space-y-5">
      {/* Game tabs */}
      <div className="flex items-center gap-1 bg-[#f5f6fa] rounded-full p-1 w-fit">
        {(['pokemon'] as CardGame[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGame(g)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              game === g
                ? 'bg-white text-[#6366f1] shadow-sm'
                : 'text-[#8b8fa6] hover:text-[#1e2235]'
            }`}
          >
            {GAME_LABELS[g]}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b5b8c8]"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={game === 'pokemon' ? (pokeLang === 'jp' ? 'ค้นหาการ์ด Pokemon JP...' : 'Search Pokemon cards...') : 'Search One Piece cards...'}
          className="w-full pl-12 pr-24 py-3.5 bg-white border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder:text-[#b5b8c8] focus:outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 transition-all text-sm"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] transition-all"
        >
          Search
        </button>
      </div>

      {/* Filters - compact inline */}
      <div className="flex flex-wrap items-center gap-2">
        {game === 'pokemon' && (
          <>
            {/* Language toggle */}
            <div className="flex gap-1 bg-[#f5f6fa] rounded-lg p-0.5">
              <button type="button" onClick={() => setPokeLang('en')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${pokeLang === 'en' ? 'bg-white text-[#6366f1] shadow-sm' : 'text-[#8b8fa6]'}`}>EN</button>
              <button type="button" onClick={() => setPokeLang('jp')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${pokeLang === 'jp' ? 'bg-white text-[#6366f1] shadow-sm' : 'text-[#8b8fa6]'}`}>JP</button>
            </div>
            {pokeLang === 'en' ? (
              <>
                <Select value={pokeSupertype} onChange={setPokeSupertype} options={POKEMON_SUPERTYPES} />
                <Select value={pokeSubtype} onChange={setPokeSubtype} options={POKEMON_SUBTYPES} />
                <Select value={pokeRarity} onChange={setPokeRarity} options={POKEMON_RARITIES} />
                <Select value={pokeSeries} onChange={setPokeSeries} options={POKEMON_SERIES} />
              </>
            ) : (
              <>
                <Select value={jpEvolution} onChange={setJpEvolution} options={JP_EVOLUTION} />
                <Select value={jpType} onChange={setJpType} options={JP_TYPES} />
                <Select value={jpRarity} onChange={setJpRarity} options={POKEMON_RARITIES} />
              </>
            )}
          </>
        )}
        {/* One Piece filters temporarily disabled */}
        {/* {game === 'onepiece' && (
          <>
            <div className="flex gap-1 bg-[#f5f6fa] rounded-lg p-0.5">
              <button type="button" onClick={() => setOpLang('en')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${opLang === 'en' ? 'bg-white text-[#6366f1] shadow-sm' : 'text-[#8b8fa6]'}`}>EN</button>
              <button type="button" onClick={() => setOpLang('jp')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${opLang === 'jp' ? 'bg-white text-[#6366f1] shadow-sm' : 'text-[#8b8fa6]'}`}>JP</button>
            </div>
            <Select value={opType} onChange={setOpType} options={OP_CARD_TYPES} />
            <Select value={opRarity} onChange={setOpRarity} options={OP_RARITIES} />
          </>
        )} */}
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="text-xs text-[#8b8fa6] hover:text-[#6366f1] font-medium transition-colors underline underline-offset-2">
            Clear
          </button>
        )}
      </div>
    </form>
  )
}