'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useExchangeRates } from '@/lib/useExchangeRates'
import { useWishlist } from '@/lib/useWishlist'
import { useT } from '@/lib/i18n'
import { useLocale } from '@/lib/i18n'
import { useComments } from '@/lib/useComments'
import { useAuth } from '@/lib/useAuth'
import PriceHistoryChart from '@/components/PriceHistoryChart'
import { HoloScore } from '@/components/HoloScore'

interface PriceVariant {
 key: string
 label: string
 prices: {
 low: number | null
 mid: number | null
 high: number | null
 market: number | null
 directLow: number | null
 }
}

interface CardDetail {
 id: string
 name: string
 supertype: string
 subtypes: string[]
 hp: string | null
 types: string[] | null
 evolveFrom: string | null
 rarity: string | null
 set: { id: string; name: string; series: string; printedTotal: number; total: number; releaseDate: string }
 number: string
 artist: string | null
 flavorText: string | null
 images: { small: string; large: string }
 attacks: Array<{ name: string; cost: string[]; convertedEnergyCost: number; damage: string; text: string }> | null
 abilities: Array<{ name: string; text: string; type: string }> | null
 weaknesses: Array<{ type: string; value: string }> | null
 resistances: Array<{ type: string; value: string }> | null
 retreatCost: string[] | null
 legalities: Record<string, { legal: string }> | null
 nationalPokedexNumbers: number[] | null
 tcgplayer: { url: string | null; updatedAt: string | null }
 priceBreakdown: PriceVariant[]
 cardmarket: {
 averageSellPrice: number | null
 lowPrice: number | null
 trendPrice: number | null
 suggestedPrice: number | null
 avg1: number | null
 avg7: number | null
 avg30: number | null
 } | null
 cardmarketUrl: string | null
 cardmarketUpdatedAt: string | null
 gradedPrices?: Record<string, {
 ebay?: { avg_7d: number | null; avg_30d: number | null }
 tcgplayer?: { market: number | null }
 }> | null
 conditionPrices?: {
 nearMint: { market: number | null; low: number | null; mid: number | null; high: number | null } | null
 lightlyPlayed: { market: number | null; low: number | null; mid: number | null; high: number | null } | null
 moderatelyPlayed: { market: number | null; low: number | null; mid: number | null; high: number | null } | null
 heavilyPlayed: { market: number | null; low: number | null; mid: number | null; high: number | null } | null
 damaged: { market: number | null; low: number | null; mid: number | null; high: number | null } | null
 } | null
}

const TYPE_COLORS: Record<string, string> = {
 Colorless: 'bg-gray-400',
 Darkness: 'bg-purple-900',
 Dragon: 'bg-[#6366f1]',
 Fairy: 'bg-pink-400',
 Fighting: 'bg-orange-700',
 Fire: 'bg-orange-500',
 Grass: 'bg-green-600',
 Lightning: 'bg-yellow-500',
 Metal: 'bg-gray-500',
 Psychic: 'bg-purple-500',
 Water: 'bg-blue-500',
}

const CONDITION_CONFIG = [
 { key: 'nearMint', label: 'Near Mint', color: '#10b981', bgColor: 'bg-emerald-50' },
 { key: 'lightlyPlayed', label: 'Lightly Played', color: '#84cc16', bgColor: 'bg-lime-50' },
 { key: 'moderatelyPlayed', label: 'Moderately Played', color: '#eab308', bgColor: 'bg-yellow-50' },
 { key: 'heavilyPlayed', label: 'Heavily Played', color: '#f97316', bgColor: 'bg-orange-50' },
 { key: 'damaged', label: 'Damaged', color: '#ef4444', bgColor: 'bg-red-50' },
] as const

const CONDITION_I18N_KEYS: Record<string, string> = {
 nearMint: 'condition.nearMint',
 lightlyPlayed: 'condition.lightlyPlayed',
 moderatelyPlayed: 'condition.moderatelyPlayed',
 heavilyPlayed: 'condition.heavilyPlayed',
 damaged: 'condition.damaged',
}

const GRADE_ORDER = ['psa10', 'psa9', 'cgc10', 'cgc9.5', 'bgs10', 'bgs9.5', 'sgc10', 'sgc9.5']

const GRADE_LABELS: Record<string, string> = {
 psa10: 'PSA 10',
 psa9: 'PSA 9',
 cgc10: 'CGC 10',
 cgc9_5: 'CGC 9.5',
 cgc9: 'CGC 9',
 bgs10: 'BGS 10',
 bgs9_5: 'BGS 9.5',
 bgs9: 'BGS 9',
 sgc10: 'SGC 10',
 sgc9_5: 'SGC 9.5',
 sgc9: 'SGC 9',
}

function formatPercent(current: number | null, previous: number | null): string | null {
 if (!current || !previous || previous === 0) return null
 const pct = ((current - previous) / previous) * 100
 const sign = pct >= 0 ? '+' : ''
 return `${sign}${pct.toFixed(1)}%`
}

export default function CardDetailPage() {
 const params = useParams()
 const router = useRouter()
 const id = params.id as string
 const [card, setCard] = useState<CardDetail | null>(null)
 const [loading, setLoading] = useState(true)
 const [imgLoaded, setImgLoaded] = useState(false)
 const [showTHB, setShowTHB] = useState(false)
 const t = useT()
 const { locale } = useLocale()
 const { formatUSD, formatTHB, toUSD, toTHB } = useExchangeRates()
 const { user } = useAuth()
 const { isInWishlist, toggleWishlist } = useWishlist()
 const { comments, loading: commentsLoading, fetchComments, addComment } = useComments()
 const [newComment, setNewComment] = useState('')
 const [wishlistLoading, setWishlistLoading] = useState(false)

 const cardId = id
 const cardGame = 'pokemon'
 const wishlisted = isInWishlist(cardId, cardGame)

 useEffect(() => {
 fetchComments(cardId, cardGame)
 }, [cardId, cardGame, fetchComments])

 useEffect(() => {
 fetch(`/api/cards/pokemon/${id}`)
 .then(r => r.json())
 .then(data => {
 setCard(data)
 setLoading(false)
 fetch(`/api/prices?q=${encodeURIComponent(data.name + ' ' + data.set.name)}&game=pokemon&pageSize=5`)
 .then(r => r.json())
 .then(priceData => {
 if (priceData.data && priceData.data.length > 0) {
 const match = priceData.data.find((c: { setName: string; number: string }) =>
 c.setName?.toLowerCase().includes(data.set.name.toLowerCase())
 ) || priceData.data[0]
 setCard(prev => prev ? {
 ...prev,
 gradedPrices: match.graded || null,
 conditionPrices: match.prices ? {
 nearMint: match.prices.nearMint || null,
 lightlyPlayed: match.prices.lightlyPlayed || null,
 moderatelyPlayed: match.prices.moderatelyPlayed || null,
 heavilyPlayed: match.prices.heavilyPlayed || null,
 damaged: match.prices.damaged || null,
 } : null,
 } : prev)
 }
 })
 .catch(() => {})
 })
 .catch(() => setLoading(false))
 }, [id])

 const fmtPrice = (usdAmount: number | null | undefined): string => {
 if (usdAmount === null || usdAmount === undefined) return '—'
 if (showTHB) return formatTHB(toTHB(usdAmount))
 return formatUSD(usdAmount)
 }

 const eurToUSD = (eur: number | null): number | null => {
 if (eur === null) return null
 return toUSD(eur)
 }

 const getConditionData = (key: string) => {
 if (!card?.conditionPrices) return null
 return card.conditionPrices[key as keyof typeof card.conditionPrices] || null
 }

 const getGradedPrice = (gradeKey: string): number | null => {
 if (!card?.gradedPrices) return null
 const grade = card.gradedPrices[gradeKey]
 if (!grade) return null
 return grade.tcgplayer?.market ?? grade.ebay?.avg_7d ?? grade.ebay?.avg_30d ?? null
 }

 const hasAnyGradedPrices = () => {
 if (!card?.gradedPrices) return false
 return Object.keys(card.gradedPrices).length > 0
 }

 const hasAnyConditionPrices = () => {
 if (!card?.conditionPrices) return false
 return CONDITION_CONFIG.some(c => getConditionData(c.key) !== null)
 }

 const hasAnyVariantPrices = () => {
 if (!card?.priceBreakdown) return false
 return card.priceBreakdown.some(v => v.prices.market !== null || v.prices.low !== null || v.prices.mid !== null || v.prices.high !== null)
 }

 if (loading) {
 return (
 <div className="min-h-screen" style={{ background: '#f5f6fa' }}>
 <Navbar />
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
 <div className="flex flex-col lg:flex-row gap-8">
 <div className="flex-shrink-0">
 <div className="w-[320px] h-[448px] bg-gray-200 rounded-xl animate-pulse" />
 </div>
 <div className="flex-1 space-y-4">
 <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
 <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
 <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
 </div>
 </div>
 </div>
 </div>
 )
 }

 if (!card) {
 return (
 <div className="min-h-screen" style={{ background: '#f5f6fa' }}>
 <Navbar />
 <div className="max-w-7xl mx-auto px-4 py-20 text-center">
 <div className="text-6xl mb-4">😕</div>
 <p className="text-[#5c6078] text-lg font-medium">{t("card.cardNotFound")}</p>
 <button onClick={() => router.back()} className="mt-4 text-[#6366f1] hover:text-[#4f46e5] text-sm font-medium">
 {`← ${t("card.goBack")}`}
 </button>
 </div>
 </div>
 )
 }

 return (
 <div className="min-h-screen" style={{ background: '#f5f6fa', fontFamily: 'Inter, system-ui, sans-serif' }}>
 <Navbar />

 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 {/* Back button + Currency toggle */}
 <div className="flex items-center justify-between mb-6">
 <button onClick={() => router.back()} className="text-[#8b8fa6] hover:text-[#1e2235] text-sm flex items-center gap-1.5 transition-colors">
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
 {t("card.backToSearch")}
 </button>
 <button
 onClick={() => setShowTHB(!showTHB)}
 className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e8eaf0] rounded-lg text-xs font-semibold transition-all hover:border-[#6366f1]/30 shadow-sm"
 >
 <span className={showTHB ? 'text-[#8b8fa6]' : 'text-[#6366f1]'}>$ USD</span>
 <span className="text-[#b5b8c8]">/</span>
 <span className={showTHB ? 'text-[#6366f1]' : 'text-[#8b8fa6]'}>฿ THB</span>
 </button>
 </div>

 <div className="flex flex-col lg:flex-row gap-8">
 {/* Card image - Left side */}
 <div className="flex-shrink-0">
 <div className="sticky top-24">
 <div className="relative w-[320px] mx-auto lg:mx-0">
 {!imgLoaded && (
 <div className="w-[320px] h-[447px] bg-gray-200 rounded-xl animate-pulse" />
 )}
 <img
 src={card.images.large}
 alt={card.name}
 className={`w-full rounded-xl shadow-md transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
 style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.12)' }}
 onLoad={() => setImgLoaded(true)}
 />
 </div>
 </div>
 </div>

 {/* Card info - Right side */}
 <div className="flex-1 min-w-0 space-y-6">
 {/* Header with badge */}
 <div>
 <div className="flex items-center gap-2 mb-3">
 <span className="px-3 py-1 bg-[#6366f1] text-white rounded-lg text-xs font-semibold">Pokémon</span>
 {card.rarity && (
 <span className="px-3 py-1 bg-white border border-[#e8eaf0] text-[#5c6078] rounded-lg text-xs font-medium">
 {card.rarity}
 </span>
 )}
 </div>
 <h1 className="text-3xl font-semibold text-[#1e2235] mb-2">{card.name}</h1>
 <p className="text-[#5c6078] text-sm">
 {card.set.name} · #{card.number}
 {card.set.printedTotal && ` / ${card.set.printedTotal}`}
 </p>
 </div>

 {/* Type/HP tags */}
 <div className="flex flex-wrap gap-2">
 {card.hp && (
 <span className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-medium">
 HP {card.hp}
 </span>
 )}
 {card.types?.map(t => (
 <span
 key={t}
 className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white ${TYPE_COLORS[t] || 'bg-gray-500'}`}
 >
 {t}
 </span>
 ))}
 {card.supertype && card.supertype !== 'Pokémon' && (
 <span className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-[#e8eaf0] rounded-lg text-sm font-medium">
 {card.supertype}
 </span>
 )}
 </div>

 {/* Artist credit */}
 {card.artist && (
 <div className="text-sm text-[#8b8fa6]">
 {t("card.illustratedBy")} <span className="text-[#5c6078] font-medium">{card.artist}</span>
 </div>
 )}

 {/* Holo Score */}
 <HoloScore
 marketPrice={card.priceBreakdown?.[0]?.prices?.market ?? null}
 lowPrice={card.priceBreakdown?.[0]?.prices?.low ?? null}
 highPrice={card.priceBreakdown?.[0]?.prices?.high ?? null}
 avg7d={card.cardmarket?.avg7 ?? null}
 avg30d={card.cardmarket?.avg30 ?? null}
 trendPrice={card.cardmarket?.trendPrice ?? null}
 psa10={getGradedPrice('psa10')}
 psa9={getGradedPrice('psa9')}
 rarity={card.rarity}
 setTotal={card.set.printedTotal || card.set.total || 0}
 cardNumber={card.number}
 game="pokemon"
 />

 {/* ========== VARIANT PRICES TABLE ========== */}
 {hasAnyVariantPrices() && (
 <div className="bg-white border border-[#e8eaf0] rounded-xl overflow-hidden shadow-sm">
 <div className="px-5 py-4 border-b border-[#e8eaf0] bg-gray-50/50">
 <h2 className="text-base font-semibold text-[#1e2235]">{t("card.priceByVariant")}</h2>
 <p className="text-xs text-[#8b8fa6] mt-0.5">
 {t("card.variantPrices")}
 {card.tcgplayer?.updatedAt && ` · ${new Date(card.tcgplayer.updatedAt).toLocaleDateString()}`}
 </p>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-gray-50/50">
 <th className="text-left px-5 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">{t("card.variant")}</th>
 <th className="text-right px-4 py-3 text-xs font-semibold text-[#6366f1] uppercase tracking-wider">{t("card.market")}</th>
 <th className="text-right px-4 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">{t("card.low")}</th>
 <th className="text-right px-4 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">{t("card.mid")}</th>
 <th className="text-right px-5 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">{t("card.high")}</th>
 </tr>
 </thead>
 <tbody>
 {card.priceBreakdown.map((variant) => (
 <tr key={variant.key} className="border-t border-[#e8eaf0] hover:bg-[#f5f6fa]/50 transition-colors">
 <td className="px-5 py-3.5">
 <span className="text-[#1e2235] font-medium">{variant.label}</span>
 </td>
 <td className="text-right px-4 py-3.5">
 <span className="text-[#6366f1] font-semibold text-base">
 {fmtPrice(variant.prices.market)}
 </span>
 </td>
 <td className="text-right px-4 py-3.5 text-[#5c6078]">{fmtPrice(variant.prices.low)}</td>
 <td className="text-right px-4 py-3.5 text-[#5c6078]">{fmtPrice(variant.prices.mid)}</td>
 <td className="text-right px-5 py-3.5 text-[#5c6078]">{fmtPrice(variant.prices.high)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {card.tcgplayer?.url && (
 <div className="px-5 py-3 border-t border-[#e8eaf0] bg-gray-50/30">
 <a
 href={card.tcgplayer.url}
 target="_blank"
 rel="noopener noreferrer"
 className="text-xs text-[#6366f1] hover:text-[#4f46e5] font-medium flex items-center gap-1"
 >
 {t("card.viewOnTCGplayer")} →
 </a>
 </div>
 )}
 </div>
 )}

 {/* ========== CONDITION PRICES TABLE (Pokedata Style) ========== */}
 {hasAnyConditionPrices() && (
 <div className="bg-white border border-[#e8eaf0] rounded-xl overflow-hidden shadow-sm">
 <div className="px-5 py-4 border-b border-[#e8eaf0] bg-gray-50/50">
 <h2 className="text-base font-semibold text-[#1e2235]">{t("card.priceByCondition")}</h2>
 <p className="text-xs text-[#8b8fa6] mt-0.5">
 t("card.tcgplayerPrices")
 {card.tcgplayer?.updatedAt && ` · ${new Date(card.tcgplayer.updatedAt).toLocaleDateString()}`}
 </p>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-gray-50/50">
 <th className="text-left px-5 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">{t("card.condition")}</th>
 <th className="text-right px-4 py-3 text-xs font-semibold text-[#6366f1] uppercase tracking-wider">{t("card.market")}</th>
 <th className="text-right px-4 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">{t("card.low")}</th>
 <th className="text-right px-4 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">{t("card.mid")}</th>
 <th className="text-right px-5 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">{t("card.high")}</th>
 </tr>
 </thead>
 <tbody>
 {CONDITION_CONFIG.map((condition, i) => {
 const data = getConditionData(condition.key)
 if (!data) return null
 return (
 <tr key={condition.key} className="border-t border-[#e8eaf0] hover:bg-[#f5f6fa]/50 transition-colors">
 <td className="px-5 py-3.5">
 <div className="flex items-center gap-2">
 <span
 className="w-2.5 h-2.5 rounded-full"
 style={{ backgroundColor: condition.color }}
 />
 <span className="text-[#1e2235] font-medium">{t((CONDITION_I18N_KEYS[condition.key] || 'condition.damaged') as any) || condition.label}</span>
 </div>
 </td>
 <td className="text-right px-4 py-3.5">
 <span className="text-[#6366f1] font-semibold text-base">
 {fmtPrice(data.market)}
 </span>
 </td>
 <td className="text-right px-4 py-3.5 text-[#5c6078]">{fmtPrice(data.low)}</td>
 <td className="text-right px-4 py-3.5 text-[#5c6078]">{fmtPrice(data.mid)}</td>
 <td className="text-right px-5 py-3.5 text-[#5c6078]">{fmtPrice(data.high)}</td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 {card.tcgplayer?.url && (
 <div className="px-5 py-3 border-t border-[#e8eaf0] bg-gray-50/30">
 <a
 href={card.tcgplayer.url}
 target="_blank"
 rel="noopener noreferrer"
 className="text-xs text-[#6366f1] hover:text-[#4f46e5] font-medium flex items-center gap-1"
 >
 {t("card.viewOnTCGplayer")} →
 </a>
 </div>
 )}
 </div>
 )}

 {/* ========== GRADED PRICES TABLE ========== */}
 {hasAnyGradedPrices() && (
 <div className="bg-white border border-[#e8eaf0] rounded-xl overflow-hidden shadow-sm">
 <div className="px-5 py-4 border-b border-[#e8eaf0] bg-gray-50/50">
 <h2 className="text-base font-semibold text-[#1e2235]">{t("card.graded")}</h2>
 <p className="text-xs text-[#8b8fa6] mt-0.5">{t("card.psaDesc")}</p>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-gray-50/50">
 <th className="text-left px-5 py-3 text-xs font-semibold text-[#5c6078] uppercase tracking-wider">{locale === "th" ? "เกรด" : "Grade"}</th>
 <th className="text-right px-5 py-3 text-xs font-semibold text-[#6366f1] uppercase tracking-wider">{t("card.market")}</th>
 </tr>
 </thead>
 <tbody>
 {GRADE_ORDER.map((gradeKey) => {
 const price = getGradedPrice(gradeKey)
 if (price === null) return null
 const label = GRADE_LABELS[gradeKey] || gradeKey.toUpperCase()
 const isHighGrade = gradeKey.includes('10') || gradeKey.includes('9.5')
 return (
 <tr key={gradeKey} className="border-t border-[#e8eaf0] hover:bg-[#f5f6fa]/50 transition-colors">
 <td className="px-5 py-3.5">
 <span className={`font-semibold ${isHighGrade ? 'text-[#6366f1]' : 'text-[#1e2235]'}`}>
 {label}
 </span>
 </td>
 <td className="text-right px-5 py-3.5">
 <span className={`font-semibold text-base ${isHighGrade ? 'text-[#6366f1]' : 'text-[#1e2235]'}`}>
 {fmtPrice(price)}
 </span>
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* ========== CARDMARKET SECTION ========== */}
 {card.cardmarket?.trendPrice && (
 <div className="bg-white border border-[#e8eaf0] rounded-xl overflow-hidden shadow-sm">
 <div className="px-5 py-4 border-b border-[#e8eaf0] bg-gray-50/50">
 <h2 className="text-base font-semibold text-[#1e2235]">{t("card.cardmarket")}</h2>
 <p className="text-xs text-[#8b8fa6] mt-0.5">
 t("card.cardmarketDesc")
 {card.cardmarketUpdatedAt && ` · ${new Date(card.cardmarketUpdatedAt).toLocaleDateString()}`}
 </p>
 </div>
 <div className="p-5">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="col-span-2 md:col-span-1 bg-[#6366f1]/5 border border-[#6366f1]/10 rounded-lg p-4">
 <p className="text-xs text-[#6366f1]/70 font-medium uppercase tracking-wider">{t("card.trendPrice")}</p>
 <p className="text-2xl font-semibold text-[#6366f1] mt-1">
 {fmtPrice(eurToUSD(card.cardmarket.trendPrice))}
 </p>
 </div>
 <div className="bg-gray-50 rounded-lg p-4">
 <p className="text-xs text-[#8b8fa6] font-medium uppercase tracking-wider">{t("card.avgSell")}</p>
 <p className="text-lg font-semibold text-[#1e2235] mt-1">
 {fmtPrice(eurToUSD(card.cardmarket.averageSellPrice))}
 </p>
 </div>
 <div className="bg-gray-50 rounded-lg p-4">
 <p className="text-xs text-[#8b8fa6] font-medium uppercase tracking-wider">{t("card.lowPrice")}</p>
 <p className="text-lg font-semibold text-[#1e2235] mt-1">
 {fmtPrice(eurToUSD(card.cardmarket.lowPrice))}
 </p>
 </div>
 <div className="bg-gray-50 rounded-lg p-4">
 <p className="text-xs text-[#8b8fa6] font-medium uppercase tracking-wider">{t("card.7dayAvg")}</p>
 <p className="text-lg font-semibold text-[#1e2235] mt-1">
 {fmtPrice(eurToUSD(card.cardmarket.avg7))}
 </p>
 </div>
 </div>
 </div>
 {card.cardmarketUrl && (
 <div className="px-5 py-3 border-t border-[#e8eaf0] bg-gray-50/30">
 <a
 href={card.cardmarketUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="text-xs text-[#6366f1] hover:text-[#4f46e5] font-medium flex items-center gap-1"
 >
 {t("card.viewOnCardMarket")} →
 </a>
 </div>
 )}
 </div>
 )}

 {/* Price History Chart */}
 <PriceHistoryChart cardId={id} game="pokemon" height={280} />

 {/* No prices message */}
 {!hasAnyVariantPrices() && !hasAnyConditionPrices() && !hasAnyGradedPrices() && !card.cardmarket?.trendPrice && (
 <div className="bg-white border border-[#e8eaf0] rounded-xl p-8 text-center shadow-sm">
 <div className="text-4xl mb-3">📊</div>
 <p className="text-[#5c6078] font-medium">{t("card.noPriceData")}</p>
 <p className="text-[#8b8fa6] text-sm mt-1">{t("card.noPriceDesc")}</p>
 </div>
 )}

 {/* ========== CARD DETAILS ========== */}
 <div className="bg-white border border-[#e8eaf0] rounded-xl p-5 shadow-sm">
 <h2 className="text-base font-semibold text-[#1e2235] mb-4">{t("card.cardDetails")}</h2>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
 {card.set.series && (
 <div>
 <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">{t("card.series")}</p>
 <p className="text-[#1e2235] font-medium mt-0.5">{card.set.series}</p>
 </div>
 )}
 {card.set.releaseDate && (
 <div>
 <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">{t("card.released")}</p>
 <p className="text-[#1e2235] font-medium mt-0.5">
 {new Date(card.set.releaseDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
 </p>
 </div>
 )}
 {card.nationalPokedexNumbers && card.nationalPokedexNumbers.length > 0 && (
 <div>
 <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">{t("card.pokedex")}</p>
 <p className="text-[#1e2235] font-medium mt-0.5">{card.nationalPokedexNumbers.join(', ')}</p>
 </div>
 )}
 {card.subtypes && card.subtypes.length > 0 && (
 <div>
 <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">{t("card.subtypes")}</p>
 <p className="text-[#1e2235] font-medium mt-0.5">{card.subtypes.join(', ')}</p>
 </div>
 )}
 </div>
 </div>

 {/* Abilities */}
 {card.abilities && card.abilities.length > 0 && (
 <div className="bg-white border border-[#e8eaf0] rounded-xl p-5 shadow-sm">
 <h2 className="text-base font-semibold text-[#1e2235] mb-3">{t("card.abilities")}</h2>
 {card.abilities.map((ability, i) => (
 <div key={i} className="mb-3 last:mb-0">
 <p className="text-sm font-semibold text-[#6366f1]">{ability.name}</p>
 <p className="text-sm text-[#5c6078] mt-1 leading-relaxed">{ability.text}</p>
 </div>
 ))}
 </div>
 )}

 {/* Attacks */}
 {card.attacks && card.attacks.length > 0 && (
 <div className="bg-white border border-[#e8eaf0] rounded-xl p-5 shadow-sm">
 <h2 className="text-base font-semibold text-[#1e2235] mb-3">{t("card.attacks")}</h2>
 <div className="space-y-3">
 {card.attacks.map((attack, i) => (
 <div key={i} className="flex items-start gap-3 pb-3 border-b border-[#e8eaf0] last:border-0 last:pb-0">
 <div className="flex-shrink-0">
 <span className="text-sm font-semibold text-[#1e2235]">{attack.damage}</span>
 </div>
 <div className="flex-1">
 <p className="text-sm font-semibold text-[#1e2235]">{attack.name}</p>
 {attack.text && <p className="text-xs text-[#5c6078] mt-0.5">{attack.text}</p>}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Weakness / Resistance / Retreat */}
 {(card.weaknesses?.length || card.resistances?.length || card.retreatCost?.length) ? (
 <div className="bg-white border border-[#e8eaf0] rounded-xl p-5 shadow-sm">
 <div className="grid grid-cols-3 gap-4 text-sm">
 {card.weaknesses && card.weaknesses.length > 0 && (
 <div>
 <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">{t("card.weakness")}</p>
 {card.weaknesses.map((w, i) => (
 <p key={i} className="text-[#1e2235] font-medium mt-0.5">{w.type} {w.value}</p>
 ))}
 </div>
 )}
 {card.resistances && card.resistances.length > 0 && (
 <div>
 <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">{t("card.resistance")}</p>
 {card.resistances.map((r, i) => (
 <p key={i} className="text-[#1e2235] font-medium mt-0.5">{r.type} {r.value}</p>
 ))}
 </div>
 )}
 {card.retreatCost && card.retreatCost.length > 0 && (
 <div>
 <p className="text-[#8b8fa6] text-xs uppercase tracking-wider">{t("card.retreat")}</p>
 <p className="text-[#1e2235] font-medium mt-0.5">{card.retreatCost.length}</p>
 </div>
 )}
 </div>
 </div>
 ) : null}

 {/* Flavor text */}
 {card.flavorText && (
 <div className="bg-white border border-[#e8eaf0] rounded-xl p-5 shadow-sm">
 <p className="text-sm text-[#5c6078] italic leading-relaxed">&ldquo;{card.flavorText}&rdquo;</p>
 </div>
 )}

 {/* Legalities */}
 {card.legalities && Object.keys(card.legalities).length > 0 && (
 <div className="flex flex-wrap gap-2">
 {Object.entries(card.legalities).map(([format, info]) => (
 <span
 key={format}
 className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
 info.legal === 'Legal'
 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
 : 'bg-red-50 text-red-600 border border-red-100'
 }`}
 >
 {format}: {info.legal}
 </span>
 ))}
 </div>
 )}

 {/* ========== WISHLIST + COMMUNITY SECTION ========== */}
 <div className="mt-8 space-y-6">
 {/* Action Buttons */}
 <div className="flex flex-wrap gap-3">
 <button
 onClick={async () => {
 if (!user) { window.location.href = '/login'; return }
 setWishlistLoading(true)
 await toggleWishlist(cardId, cardGame)
 setWishlistLoading(false)
 }}
 disabled={wishlistLoading}
 className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
 wishlisted
 ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
 : 'bg-[#6366f1] text-white hover:bg-[#4f46e5] shadow-sm'
 }`}
 >
 {wishlisted ? '♥ card.inWishlist' : '+ Add to Wishlist'}
 </button>
 <button
 onClick={() => {
 if (!user) { window.location.href = '/login'; return }
 const price = card.conditionPrices?.nearMint?.market || 0
 const target = prompt('Set price alert (USD):\n\nType a target price below current $' + price.toFixed(2) + ' to get notified when it drops,\nor above to get notified when it rises.', price ? (price * 0.8).toFixed(2) : '10.00')
 if (!target || isNaN(Number(target))) return
 const dir = Number(target) < price ? 'below' : 'above'
 fetch('/api/price-alerts', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.access_token}` },
 body: JSON.stringify({ card_name: card.name, game: 'pokemon', card_id: cardId, target_price: Number(target), direction: dir })
 }).then(r => r.json()).then(data => {
 if (data.alert) alert('Price alert set! ' + (dir === 'below' ? 'Below' : 'Above') + ' $' + Number(target).toFixed(2))
 else alert('Failed: ' + (data.error || 'Unknown error'))
 })
 }}
 className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e8eaf0] text-[#5c6078] rounded-xl font-semibold text-sm hover:text-[#6366f1] hover:border-[#6366f1]/20 transition-all shadow-sm"
 >
 🔔 t("card.setPriceAlert")
 </button>
 <button
 onClick={() => {
 const section = document.getElementById('comments')
 section?.scrollIntoView({ behavior: 'smooth' })
 }}
 className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e8eaf0] text-[#5c6078] rounded-xl font-semibold text-sm hover:text-[#6366f1] hover:border-[#6366f1]/30 transition-all shadow-sm"
 >
 Comments ({comments.length})
 </button>
 </div>

 {/* Comments Section */}
 <div id="comments" className="bg-white border border-[#e8eaf0] rounded-xl p-5 shadow-sm">
 <h2 className="text-base font-semibold text-[#1e2235] mb-4">{t("card.communityDiscussion")}</h2>

 {/* Comment input */}
 {user ? (
 <div className="mb-4">
 <textarea
 value={newComment}
 onChange={(e) => setNewComment(e.target.value)}
 placeholder={t("card.shareYourThoughts")}
 maxLength={1000}
 rows={3}
 className="w-full px-4 py-3 bg-[#fafbfc] border border-[#e8eaf0] rounded-xl text-[#1e2235] placeholder:text-[#b5b8c8] focus:outline-none focus:border-[#6366f1]/50 resize-none text-sm transition-colors"
 />
 <div className="flex justify-between items-center mt-2">
 <span className="text-xs text-[#b5b8c8]">{newComment.length}/1000</span>
 <button
 onClick={async () => {
 if (!newComment.trim()) return
 await addComment(cardId, cardGame, newComment.trim())
 setNewComment('')
 }}
 disabled={!newComment.trim()}
 className="px-5 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
 >
 {t("card.postComment")}
 </button>
 </div>
 </div>
 ) : (
 <div className="bg-[#fafbfc] rounded-xl p-4 mb-4 text-center">
 <p className="text-sm text-[#8b8fa6]">{t("card.signInToComment")}</p>
 <a
 href="/login"
 className="inline-block mt-2 px-5 py-2 bg-[#6366f1] text-white rounded-lg text-sm font-semibold hover:bg-[#4f46e5] transition-all"
 >
 Sign In
 </a>
 </div>
 )}

 {/* Comments list */}
 {commentsLoading ? (
 <div className="text-center py-6 text-[#8b8fa6] text-sm">Loading comments...</div>
 ) : comments.length === 0 ? (
 <div className="text-center py-8">
 <div className="text-3xl mb-2 opacity-40">💬</div>
 <p className="text-[#8b8fa6] text-sm">{t("card.noComments")}</p>
 </div>
 ) : (
 <div className="space-y-3">
 {comments.map((comment) => (
 <div key={comment.id} className="bg-[#fafbfc] rounded-xl p-4">
 <div className="flex items-center gap-3 mb-2">
 <div className="w-8 h-8 rounded-full bg-[#6366f1]/10 flex items-center justify-center text-sm font-semibold text-[#6366f1]">
 {comment.profiles?.username?.charAt(0).toUpperCase() || '?'}
 </div>
 <div className="flex-1 min-w-0">
 <a
 href={`/u/${comment.profiles?.username || ''}`}
 className="text-sm font-semibold text-[#6366f1] hover:text-[#4f46e5]"
 >
 {comment.profiles?.username || 'Unknown'}
 </a>
 <span className="text-xs text-[#b5b8c8] ml-2">
 {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
 </span>
 </div>
 </div>
 <p className="text-sm text-[#5c6078] leading-relaxed pl-11">{comment.content}</p>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 )
}
