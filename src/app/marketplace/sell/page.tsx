'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/lib/useAuth'
import { useT } from '@/lib/i18n'

const CONDITIONS = [
  { key: 'nm', label: 'marketplace.nearMint' },
  { key: 'lp', label: 'marketplace.lightlyPlayed' },
  { key: 'mp', label: 'marketplace.moderatelyPlayed' },
  { key: 'hp', label: 'marketplace.heavilyPlayed' },
  { key: 'dmg', label: 'marketplace.damaged' },
  { key: 'graded', label: 'marketplace.graded' },
]

const GAMES = [
  { key: 'pokemon', label: 'marketplace.pokemon' },
  { key: 'pokemon-jp', label: 'marketplace.pokemonJp' },
  { key: 'onepiece', label: 'marketplace.onePiece' },
]

const GRADED_COMPANIES = ['PSA', 'BGS', 'CGC', 'SGC']

export default function SellPage() {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<{seller_status?: string} | null>(null)

  useEffect(() => {
    if (!user) return
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=seller_status`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${user.access_token}` },
    })
      .then(r => r.json())
      .then(data => setUserProfile(data?.[0] || null))
      .catch(() => setUserProfile(null))
  }, [user])
  const router = useRouter()
  const t = useT()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [game, setGame] = useState('pokemon')
  const [cardId, setCardId] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardImage, setCardImage] = useState('')
  const [condition, setCondition] = useState('nm')
  const [gradedCompany, setGradedCompany] = useState('')
  const [gradedGrade, setGradedGrade] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [quantity, setQuantity] = useState('1')
  const [description, setDescription] = useState('')

  if (!user) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-[#8b8fa6]">{t('marketplace.signInToList')}</p>
          <a href="/login" className="inline-block mt-3 px-5 py-2 bg-[#6366f1] text-white rounded-xl text-sm font-bold hover:bg-[#4f46e5]">{t('common.signIn')}</a>
        </div>
      </div>
    )
  }

  const isVerifiedSeller = userProfile?.seller_status === 'verified'

  if (!isVerifiedSeller) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="text-5xl mb-4">🏪</div>
          <h2 className="text-xl font-bold text-[#1e2235] mb-2">{t('marketplace.verificationRequired')}</h2>
          <p className="text-sm text-[#8b8fa6] mb-4">{t('marketplace.verificationRequiredDesc')}</p>
          <Link href="/seller/apply" className="inline-block px-5 py-2 bg-[#6366f1] text-white rounded-xl text-sm font-bold hover:bg-[#4f46e5]">
            {t('marketplace.applyAsSeller')}
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardId.trim() || !cardName.trim() || !price) {
      setError(t('marketplace.fillRequired'))
      return
    }

    if (condition === 'graded' && (!gradedCompany || !gradedGrade)) {
      setError(t('marketplace.gradedInfoRequired'))
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({
          seller_id: user.id,
          game,
          card_id: cardId.trim(),
          card_name: cardName.trim(),
          card_image: cardImage.trim() || null,
          condition,
          graded_company: condition === 'graded' ? gradedCompany : null,
          graded_grade: condition === 'graded' ? gradedGrade : null,
          price: parseFloat(price),
          currency,
          quantity: parseInt(quantity) || 1,
          description: description.trim() || null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSuccess(t('marketplace.listingCreated'))
        setTimeout(() => router.push('/marketplace'), 1500)
      } else {
        setError(data.error || t('marketplace.listingFailed'))
      }
    } catch {
      setError(t('marketplace.listingFailed'))
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#8b8fa6] mb-4">
          <Link href="/marketplace" className="hover:text-[#6366f1]">{t('marketplace.title')}</Link>
          <span>/</span>
          <span className="text-[#1e2235]">{t('marketplace.listForSale')}</span>
        </div>

        <h1 className="text-xl font-extrabold text-[#1e2235] mb-6">📦 {t('marketplace.listForSale')}</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-[#e8eaf0] rounded-2xl p-5 space-y-5">
          {/* Game */}
          <div>
            <label className="block text-sm text-[#5c6078] mb-1 font-medium">{t('marketplace.game')} *</label>
            <div className="flex gap-1 bg-[#f5f6fa] rounded-xl p-1">
              {GAMES.map(g => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGame(g.key)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    game === g.key ? 'bg-[#6366f1] text-white shadow-sm' : 'text-[#5c6078] hover:bg-white/50'
                  }`}
                >
                  {t(g.label as any)}
                </button>
              ))}
            </div>
          </div>

          {/* Card ID + Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[#5c6078] mb-1 font-medium">{t('marketplace.cardId')} *</label>
              <input
                type="text"
                value={cardId}
                onChange={e => setCardId(e.target.value)}
                placeholder={t('marketplace.cardIdPlaceholder')}
                className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-sm text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#5c6078] mb-1 font-medium">{t('marketplace.cardName')} *</label>
              <input
                type="text"
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                placeholder={t('marketplace.cardNamePlaceholder')}
                className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-sm text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm text-[#5c6078] mb-1 font-medium">{t('marketplace.imageUrl')}</label>
            <input
              type="text"
              value={cardImage}
              onChange={e => setCardImage(e.target.value)}
              placeholder={t('marketplace.imageUrlPlaceholder')}
              className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-sm text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm text-[#5c6078] mb-1 font-medium">{t('marketplace.condition')} *</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              {CONDITIONS.map(c => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCondition(c.key)}
                  className={`px-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    condition === c.key ? 'bg-[#6366f1] text-white shadow-sm' : 'bg-[#f5f6fa] text-[#5c6078] hover:bg-white border border-[#e8eaf0]'
                  }`}
                >
                  {t(c.label as any)}
                </button>
              ))}
            </div>
          </div>

          {/* Graded info (if graded) */}
          {condition === 'graded' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[#5c6078] mb-1 font-medium">{t('marketplace.gradingCompany')} *</label>
                <select
                  value={gradedCompany}
                  onChange={e => setGradedCompany(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-sm text-[#1e2235] focus:border-[#6366f1] focus:outline-none"
                >
                  <option value="">{t('marketplace.selectCompany')}</option>
                  {GRADED_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#5c6078] mb-1 font-medium">{t('marketplace.grade')} *</label>
                <input
                  type="text"
                  value={gradedGrade}
                  onChange={e => setGradedGrade(e.target.value)}
                  placeholder="10, 9.5, 9..."
                  className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-sm text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Price + Quantity */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-[#5c6078] mb-1 font-medium">{t('marketplace.price')} (USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-sm text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#5c6078] mb-1 font-medium">{t('marketplace.quantity')}</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-sm text-[#1e2235] focus:border-[#6366f1] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[#5c6078] mb-1 font-medium">{t('marketplace.currency')}</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-sm text-[#1e2235] focus:border-[#6366f1] focus:outline-none"
              >
                <option value="USD">USD</option>
                <option value="THB">THB</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-[#5c6078] mb-1 font-medium">{t('marketplace.description')}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder={t('marketplace.descriptionPlaceholder')}
              className="w-full px-4 py-2.5 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-sm text-[#1e2235] placeholder-[#b5b8c8] focus:border-[#6366f1] focus:outline-none resize-none"
            />
          </div>

          {/* Error / Success */}
          {error && <p className="text-sm text-red-500 bg-red-500/10 rounded-xl px-4 py-2">{error}</p>}
          {success && <p className="text-sm text-emerald-600 bg-emerald-500/10 rounded-xl px-4 py-2">{success}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#6366f1] text-white rounded-xl text-sm font-bold hover:bg-[#4f46e5] transition-colors disabled:opacity-50"
          >
            {submitting ? t('marketplace.creating') : t('marketplace.createListing')}
          </button>
        </form>
      </div>
    </div>
  )
}