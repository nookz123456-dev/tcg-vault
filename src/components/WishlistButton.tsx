'use client'

import { useWishlist } from '@/lib/wishlist'
import { useT } from '@/lib/i18n'

// Star toggle to add/remove a card from the wishlist.
// variant "button" = labeled pill (card detail); "icon" = compact star (tiles).
export default function WishlistButton({ id, variant = 'button' }: { id: string; variant?: 'button' | 'icon' }) {
  const { has, toggle } = useWishlist()
  const tt = useT()
  const active = has(id)

  const Star = (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9L12 3.5z" />
    </svg>
  )

  if (variant === 'icon') {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id) }}
        aria-label={active ? tt('mhr.wl.remove') : tt('mhr.wl.add')}
        title={active ? tt('mhr.wl.remove') : tt('mhr.wl.add')}
        className={`grid place-items-center w-8 h-8 rounded-lg border backdrop-blur-sm transition-colors ${active ? 'bg-gold/20 border-gold/50 text-gold-bright' : 'bg-black/40 border-line text-body hover:text-gold-bright'}`}
      >
        {Star}
      </button>
    )
  }

  return (
    <button
      onClick={() => toggle(id)}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${active ? 'bg-gold/15 border-gold/50 text-gold-bright' : 'btn-ghost text-body hover:text-gold-bright'}`}
    >
      {Star}
      {active ? tt('mhr.wl.saved') : tt('mhr.wl.add')}
    </button>
  )
}
