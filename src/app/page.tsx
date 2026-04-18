'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import TrendingCarousel from '@/components/TrendingCarousel'
import TopMovers from '@/components/TopMovers'
import { useT } from '@/lib/i18n'

export default function Home() {
  const t = useT()

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f6fa]">
      <Navbar />

      {/* Trending Cards Carousel — top of page */}
      <section className="bg-white border-b border-[#e8eaf0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <TrendingCarousel />
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#6366f1]/[0.04] rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <TopMovers />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#6366f1]/5 border border-[#6366f1]/15 rounded-full text-[#6366f1] text-xs font-semibold mb-8 tracking-wide">
              <span className="w-1.5 h-1.5 bg-[#6366f1] rounded-full animate-pulse" />
              Pokemon &amp; One Piece TCG
            </div>

            {/* Title */}
            <h1 className={'text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight text-[#1e2235]'}>
              {t('home.hero.title').split(' ').map((word, i) => 
                i === 0 ? <span key={i}>{word} </span> : 
                i === 1 ? <span key={i} className="text-[#6366f1]">{word} </span> : 
                <span key={i}>{word} </span>
              )}
            </h1>

            <p className="text-lg md:text-xl text-[#5c6078] max-w-2xl mx-auto mb-12 leading-relaxed">
              {t('home.hero.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/search"
                className="group px-8 py-4 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] transition-all text-lg shadow-md shadow-[#6366f1]/20"
              >
                {t('home.hero.cta')}
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/sets"
                className="px-8 py-4 bg-white border border-[#e8eaf0] text-[#3b3f56] font-bold rounded-xl hover:text-[#6366f1] hover:border-[#6366f1]/30 transition-all text-lg"
              >
                {t('home.hero.cta2')}
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 md:gap-12 text-center">
              <div>
                <div className="text-3xl font-extrabold text-[#1e2235]">40K+</div>
                <div className="text-sm text-[#8b8fa6] mt-1">{t('home.stats.cards')}</div>
              </div>
              <div className="w-px h-10 bg-[#e8eaf0]" />
              <div>
                <div className="text-3xl font-extrabold text-[#1e2235]">370+</div>
                <div className="text-sm text-[#8b8fa6] mt-1">{t('home.stats.sets')}</div>
              </div>
              <div className="w-px h-10 bg-[#e8eaf0]" />
              <div>
                <div className="text-3xl font-extrabold text-[#1e2235]">{t('home.stats.prices').split(' ')[0]}</div>
                <div className="text-sm text-[#8b8fa6] mt-1">{t('home.stats.prices').split(' ').slice(1).join(' ')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#f5f6fa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className={'text-3xl md:text-4xl font-extrabold text-[#1e2235] mb-4 tracking-tight'}>
              {t('home.features.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🔍', title: t('home.features.search'), desc: t('home.features.searchDesc'), accent: 'indigo' },
              { icon: '📊', title: t('home.features.prices'), desc: t('home.features.pricesDesc'), accent: 'emerald' },
              { icon: '💎', title: t('home.features.graded'), desc: t('home.features.gradedDesc'), accent: 'amber' },
              { icon: '🃏', title: t('home.features.collection'), desc: t('home.features.collectionDesc'), accent: 'rose' },
              { icon: '👥', title: t('home.features.community'), desc: t('home.features.communityDesc'), accent: 'violet' },
              { icon: '📦', title: t('home.features.sealed'), desc: t('home.features.sealedDesc'), accent: 'sky' },
            ].map((feature, i) => (
              <div key={i} className="group bg-white border border-[#e8eaf0] rounded-2xl p-8 hover:shadow-lg hover:border-[#6366f1]/20 transition-all duration-300">
                <div className="w-12 h-12 bg-[#6366f1]/10 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-[#1e2235] mb-3">{feature.title}</h3>
                <p className="text-[#5c6078] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-t border-[#e8eaf0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className={'text-3xl md:text-4xl font-extrabold text-[#1e2235] mb-4 tracking-tight'}>
              {t('home.how.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: t('home.how.step1'), desc: t('home.how.step1Desc') },
              { step: t('home.how.step2'), desc: t('home.how.step2Desc') },
              { step: t('home.how.step3'), desc: t('home.how.step3Desc') },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-[#6366f1]/10 rounded-2xl flex items-center justify-center text-xl font-bold text-[#6366f1] mx-auto mb-6 border border-[#6366f1]/20">
                  {i + 1}
                </div>
                <h3 className="text-[#1e2235] font-bold mb-2">{item.step}</h3>
                <p className="text-[#8b8fa6] text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community CTA */}
      <section className="bg-[#f5f6fa] border-t border-[#e8eaf0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6366f1]/5 border border-[#6366f1]/15 rounded-full text-[#6366f1] text-xs font-semibold mb-4">
                👥 {t('nav.community')}
              </div>
              <h2 className={'text-3xl md:text-4xl font-extrabold text-[#1e2235] mb-4 tracking-tight'}>
                {t('home.community.title')}
              </h2>
              <p className="text-[#5c6078] leading-relaxed mb-6">
                {t('home.community.desc')}
              </p>
              <div className="flex gap-3">
                <Link
                  href="/community"
                  className="px-6 py-3 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] transition-all shadow-sm shadow-[#6366f1]/25"
                >
                  {t('home.community.cta')}
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 bg-white border border-[#e8eaf0] text-[#3b3f56] font-bold rounded-xl hover:text-[#6366f1] hover:border-[#6366f1]/30 transition-all"
                >
                  {t('nav.signIn')}
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white border border-[#e8eaf0] rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 bg-[#6366f1]/10 rounded-full flex items-center justify-center text-sm">👤</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1e2235]">PikachuCollector</p>
                  <p className="text-xs text-[#8b8fa6]">added Charizard 1st Edition</p>
                </div>
                <span className="text-xs text-[#b5b8c8]">2m</span>
              </div>
              <div className="bg-white border border-[#e8eaf0] rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 bg-rose-50 rounded-full flex items-center justify-center text-sm">🏴‍☠️</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1e2235]">LuffyFan99</p>
                  <p className="text-xs text-[#8b8fa6]">listed for trade: OP01 Luffy</p>
                </div>
                <span className="text-xs text-[#b5b8c8]">15m</span>
              </div>
              <div className="bg-white border border-[#e8eaf0] rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-sm">⭐</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1e2235]">CardMaster</p>
                  <p className="text-xs text-[#8b8fa6]">reached 500 cards 🎉</p>
                </div>
                <span className="text-xs text-[#b5b8c8]">1h</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e8eaf0] bg-[#f5f6fa] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🃏</span>
              <span className="text-sm font-bold text-[#6366f1]">TCG Vault</span>
            </div>
            <p className="text-xs text-[#8b8fa6]">
              {t('home.footer.desc')} · Made with ♥ by Sora
            </p>
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