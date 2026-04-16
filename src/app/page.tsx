import Link from 'next/link'
import TrendingCarousel from '@/components/TrendingCarousel'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-[var(--card-border)] bg-[var(--surface-1)]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🃏</span>
              <span className="text-xl font-bold text-amber-400">
                TCG Vault
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/search" className="text-sm text-gray-400 hover:text-white transition-colors">
                Search
              </Link>
              <Link href="/collection" className="text-sm text-gray-400 hover:text-white transition-colors">
                Collection
              </Link>
              <Link
                href="/login"
                className="text-sm px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Trending Cards Carousel — top of page */}
      <section className="border-b border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <TrendingCarousel />
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/10 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              Pokemon & One Piece Card Tracker
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">Track Your </span>
              <span className="text-amber-400">
                Card Collection
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Monitor market prices, track portfolio value, and manage your entire Pokemon & One Piece card collection in one place.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/search"
                className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-2xl hover:from-amber-400 hover:to-amber-500 transition-all text-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
              >
                Search Cards
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/collection"
                className="px-8 py-4 bg-[var(--surface-1)] border border-[var(--card-border)] text-gray-300 font-bold rounded-2xl hover:text-amber-400 hover:border-amber-500/30 transition-all text-lg"
              >
                My Collection
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 md:gap-12 text-center">
              <div>
                <div className="text-3xl font-bold text-white">14K+</div>
                <div className="text-sm text-gray-500 mt-1">Card Sets</div>
              </div>
              <div className="w-px h-10 bg-[var(--card-border)]" />
              <div>
                <div className="text-3xl font-bold text-white">Real-time</div>
                <div className="text-sm text-gray-500 mt-1">Market Prices</div>
              </div>
              <div className="w-px h-10 bg-[var(--card-border)]" />
              <div>
                <div className="text-3xl font-bold text-white">Free</div>
                <div className="text-sm text-gray-500 mt-1">Forever</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              From searching cards to tracking your portfolio — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 hover:border-amber-500/30 transition-all">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                🔍
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Instant Search</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Browse thousands of Pokemon cards with real-time data from the Pokemon TCG API. Filter by set, rarity, type, and more.
              </p>
            </div>

            <div className="group bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 hover:border-amber-500/30 transition-all">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Price Tracking</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                See market prices from TCGplayer. Track low, mid, high, and market values for every card in your collection.
              </p>
            </div>

            <div className="group bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 hover:border-amber-500/30 transition-all">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                💰
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">Portfolio P&L</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                See your total collection value, total invested, and profit/loss at a glance. Know exactly how your cards are performing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Get started in seconds
            </h2>
            <p className="text-gray-400">No setup required. Just search and add.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 border border-amber-500/20">
                1
              </div>
              <h3 className="text-white font-semibold mb-2">Search for cards</h3>
              <p className="text-gray-500 text-sm">Type any card name and browse results with live market prices.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 border border-amber-500/20">
                2
              </div>
              <h3 className="text-white font-semibold mb-2">Add to collection</h3>
              <p className="text-gray-500 text-sm">One click to add any card. Set quantity, condition, and purchase price.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 border border-amber-500/20">
                3
              </div>
              <h3 className="text-white font-semibold mb-2">Track your portfolio</h3>
              <p className="text-gray-500 text-sm">Watch your total value grow. See profit, loss, and individual card performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to track your collection?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Start building your portfolio today. Free, fast, and secure.
            </p>
            <Link
              href="/search"
              className="inline-block px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-2xl hover:from-amber-400 hover:to-amber-500 transition-all text-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--card-border)] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🃏</span>
              <span className="text-sm font-semibold text-amber-400">
                TCG Vault
              </span>
            </div>
            <p className="text-xs text-gray-600">
              Card data from Pokemon TCG API &bull; Prices from TCGplayer &bull; Made with ♥ by Sora
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-600">
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