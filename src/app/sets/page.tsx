import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { marvelSets, MARVEL } from '@/lib/marvel'
import products from '@/lib/marvel-products.json'

export const metadata = {
  title: 'เซ็ตการ์ด · Marvel Hero Rush | Vaultverse',
  description: 'เลือกเซ็ต Marvel Hero Rush เพื่อดูการ์ดและราคากลางทั้งหมด',
}

const SET_STYLE: Record<string, { emoji: string; accent: string; sub: string; glow: string }> = {
  BP01: { emoji: '📦', accent: 'from-marvel to-marvel-deep', sub: 'บูสเตอร์หลัก', glow: 'rgba(236,29,36,0.26)' },
  SD01: { emoji: '🔴', accent: 'from-attr-red to-marvel-deep', sub: 'Reality Stone', glow: 'rgba(240,53,59,0.24)' },
  SD02: { emoji: '🟡', accent: 'from-attr-yellow to-gold', sub: 'Mind Stone', glow: 'rgba(245,192,51,0.22)' },
  SD03: { emoji: '🔵', accent: 'from-attr-blue to-cosmic-blue', sub: 'Space Stone', glow: 'rgba(59,130,246,0.24)' },
  SD04: { emoji: '🟢', accent: 'from-attr-green to-cosmic-cyan', sub: 'Time Stone', glow: 'rgba(34,192,122,0.22)' },
}

export default function SetsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">📂</span>
          <h1 className="font-display text-3xl font-extrabold text-hero">เซ็ตการ์ด</h1>
        </div>
        <p className="text-muted mt-1 text-sm mb-8">
          เลือกเซ็ตเพื่อดูการ์ดและราคากลางทั้งหมด · รวม {MARVEL.total} การ์ดจาก {marvelSets.length} เซ็ต
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {marvelSets.map((s) => {
            const st = SET_STYLE[s.id] || { emoji: '🃏', accent: 'from-cosmic to-cosmic-blue', sub: '', glow: 'rgba(139,92,246,0.22)' }
            const box = products.find((p) => p.series === s.id)?.image
            return (
              <Link key={s.id} href={`/set/marvel/${s.id}`} className="mv-card rounded-2xl p-5 group flex flex-col items-center text-center">
                <div className="relative w-full aspect-[3/4] grid place-items-center mb-4">
                  <div className="absolute inset-0" style={{ background: `radial-gradient(60% 50% at 50% 45%, ${st.glow}, transparent 70%)` }} />
                  {box ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={box} alt={s.name} className="relative max-h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  ) : (
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${st.accent} grid place-items-center text-2xl`}>{st.emoji}</div>
                  )}
                </div>
                <div className="text-[11px] font-bold text-marvel tracking-wide">{s.code}</div>
                <h3 className="font-display text-base font-bold text-hero mt-0.5 group-hover:text-cosmic transition-colors leading-tight">{s.name}</h3>
                {st.sub && <div className="text-[11px] text-cosmic mt-0.5">{st.sub}</div>}
                <div className="mt-2 text-xs text-muted">{s.total} การ์ด</div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
