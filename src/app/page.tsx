'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import TopMovers from '@/components/TopMovers'
import { useT } from '@/lib/i18n'

export default function Home() {
  const t = useT()

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <Navbar />

      {/* Hero + Search */}
      <section className="relative overflow-hidden bg-white border-b border-[#e8eaf0]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#6366f1]/[0.03] rounded-full blur-[80px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10">
          <div className="text-center mb-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#6366f1]/5 border border-[#6366f1]/15 rounded-full text-[#6366f1] text-xs font-semibold mb-6 tracking-wide">
              <span className="w-1.5 h-1.5 bg-[#6366f1] rounded-full animate-pulse" />
              Pokemon TCG · JP & EN
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 leading-[1.1] tracking-tight text-[#1e2235]">
              {t('home.hero.title').split(' ').map((word, i) =>
                i === 1 ? <span key={i} className="text-[#6366f1]">{word} </span> : <span key={i}>{word} </span>
              )}
            </h1>

            <p className="text-sm sm:text-base text-[#5c6078] max-w-xl mx-auto mb-6 leading-relaxed">
              {t('home.hero.subtitle')}
            </p>

            {/* Search CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link
                href="/search"
                className="group px-6 py-3 bg-[#6366f1] text-white font-semibold rounded-xl hover:bg-[#4f46e5] transition-all text-sm shadow-sm shadow-[#6366f1]/20"
              >
                {t('home.hero.cta')}
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/sets"
                className="px-6 py-3 bg-white border border-[#e8eaf0] text-[#5c6078] font-semibold rounded-xl hover:text-[#6366f1] hover:border-[#6366f1]/30 transition-all text-sm"
              >
                {t('home.hero.cta2')}
              </Link>
              <Link
                href="/marketplace"
                className="px-6 py-3 bg-white border border-[#e8eaf0] text-[#5c6078] font-semibold rounded-xl hover:text-[#6366f1] hover:border-[#6366f1]/30 transition-all text-sm"
              >
                🛒 {t('nav.marketplace')}
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-6 sm:gap-10">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-extrabold text-[#1e2235]">40K+</div>
                <div className="text-[10px] sm:text-xs text-[#8b8fa6] mt-0.5">{t('home.stats.cards')}</div>
              </div>
              <div className="w-px h-8 bg-[#e8eaf0]" />
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-extrabold text-[#1e2235]">370+</div>
                <div className="text-[10px] sm:text-xs text-[#8b8fa6] mt-0.5">{t('home.stats.sets')}</div>
              </div>
              <div className="w-px h-8 bg-[#e8eaf0]" />
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-500">LIVE</div>
                <div className="text-[10px] sm:text-xs text-[#8b8fa6] mt-0.5">{t('home.stats.prices')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Movers */}
      <section className="bg-[#fafbfc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TopMovers />
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="bg-white border-t border-[#e8eaf0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '🔍', title: t('home.features.search'), desc: t('home.features.searchDesc'), href: '/search' },
              { icon: '📂', title: t('nav.sets'), desc: 'SV9a, SV8pt5, SV10...', href: '/sets' },
              { icon: '📦', title: t('nav.sealed'), desc: 'Booster Box, ETB...', href: '/sealed' },
              { icon: '🛒', title: t('nav.marketplace'), desc: 'Buy & sell cards', href: '/marketplace' },
            ].map((item, i) => (
              <Link key={i} href={item.href} className="group bg-[#fafbfc] border border-[#e8eaf0] rounded-xl p-4 hover:shadow-md hover:border-[#6366f1]/20 transition-all">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="text-sm font-bold text-[#1e2235] group-hover:text-[#6366f1] transition-colors">{item.title}</h3>
                <p className="text-xs text-[#8b8fa6] mt-0.5">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#fafbfc] border-t border-[#e8eaf0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1e2235] mb-8 text-center tracking-tight">
            {t('home.features.title')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '📊', title: t('home.features.prices'), desc: t('home.features.pricesDesc') },
              { icon: '💎', title: t('home.features.graded'), desc: t('home.features.gradedDesc') },
              { icon: '🃏', title: t('home.features.collection'), desc: t('home.features.collectionDesc') },
              { icon: '👥', title: t('home.features.community'), desc: t('home.features.communityDesc') },
              { icon: '📦', title: t('home.features.sealed'), desc: t('home.features.sealedDesc') },
              { icon: '🔔', title: t('nav.alerts'), desc: 'Set target prices and get notified' },
            ].map((feature, i) => (
              <div key={i} className="group bg-white border border-[#e8eaf0] rounded-xl p-5 hover:shadow-md hover:border-[#6366f1]/20 transition-all">
                <div className="w-10 h-10 bg-[#6366f1]/10 rounded-lg flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-bold text-[#1e2235] mb-1.5">{feature.title}</h3>
                <p className="text-[#5c6078] text-xs leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — compact */}
      <section className="bg-white border-t border-[#e8eaf0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1e2235] mb-8 text-center tracking-tight">
            {t('home.how.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: t('home.how.step1'), desc: t('home.how.step1Desc'), num: '1' },
              { step: t('home.how.step2'), desc: t('home.how.step2Desc'), num: '2' },
              { step: t('home.how.step3'), desc: t('home.how.step3Desc'), num: '3' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 bg-[#6366f1]/10 rounded-lg flex items-center justify-center text-sm font-bold text-[#6366f1] mx-auto mb-4 border border-[#6366f1]/20">
                  {item.num}
                </div>
                <h3 className="text-sm font-bold text-[#1e2235] mb-1">{item.step}</h3>
                <p className="text-xs text-[#8b8fa6]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community CTA */}
      <section className="bg-[#fafbfc] border-t border-[#e8eaf0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6366f1]/5 border border-[#6366f1]/15 rounded-full text-[#6366f1] text-xs font-semibold mb-4">
                👥 {t('nav.community')}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#1e2235] mb-3 tracking-tight">
                {t('home.community.title')}
              </h2>
              <p className="text-sm text-[#5c6078] leading-relaxed mb-5">
                {t('home.community.desc')}
              </p>
              <div className="flex gap-3">
                <Link href="/community" className="px-5 py-2.5 bg-[#6366f1] text-white font-semibold rounded-xl hover:bg-[#4f46e5] text-sm">
                  {t('home.community.cta')}
                </Link>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { icon: '👤', name: 'PikachuCollector', action: 'added Charizard 1st Edition', time: '2m', bg: 'bg-[#6366f1]/10' },
                { icon: '🏴‍☠️', name: 'LuffyFan99', action: 'listed for trade: OP01 Luffy', time: '15m', bg: 'bg-rose-50' },
                { icon: '⭐', name: 'CardMaster', action: 'reached 500 cards 🎉', time: '1h', bg: 'bg-emerald-50' },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-[#e8eaf0] rounded-xl p-3.5 flex items-center gap-3">
                  <div className={`w-8 h-8 ${item.bg} rounded-full flex items-center justify-center text-sm`}>{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1e2235]">{item.name}</p>
                    <p className="text-xs text-[#8b8fa6]">{item.action}</p>
                  </div>
                  <span className="text-[10px] text-[#b5b8c8]">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e8eaf0] bg-[#fafbfc] py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" className="w-4 h-4 inline-block" fill="none">
                <path d="M8 8h10v2H10v6h6v2H8V8z" fill="#6366f1"/>
                <path d="M14 16h10v2H16v6h8v2H14V16z" fill="#6366f1" opacity="0.7"/>
                <circle cx="24" cy="8" r="3" fill="#6366f1" opacity="0.5"/>
              </svg>
              <span className="text-sm font-bold text-[#6366f1]">HoloCheck</span>
            </div>
            <p className="text-xs text-[#8b8fa6]">{t('home.footer.desc')} · Made with ♥ by Sora</p>
            <div className="flex items-center gap-4 text-xs text-[#8b8fa6]">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}