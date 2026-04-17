import Link from 'next/link'
import TrendingCarousel from '@/components/TrendingCarousel'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fb]">
      {/* Navigation */}
      <nav className="border-b border-[#e5e7ef] bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="text-2xl transition-transform group-hover:scale-110">🃏</span>
              <span className="text-xl font-bold text-amber-500 tracking-tight">
                TCG Vault
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/search" className="text-sm text-[#5c6178] hover:text-amber-500 transition-colors font-medium">
                Search
              </Link>
              <Link href="/community" className="text-sm text-[#5c6178] hover:text-amber-500 transition-colors font-medium">
                Community
              </Link>
              <Link href="/collection" className="text-sm text-[#5c6178] hover:text-amber-500 transition-colors font-medium">
                Collection
              </Link>
              <Link
                href="/login"
                className="text-sm px-5 py-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-400 transition-all shadow-sm shadow-amber-500/25"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Trending Cards Carousel — top of page */}
      <section className="border-b border-[#e5e7ef] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <TrendingCarousel />
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        {/* Bright accent glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-400/[0.06] rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-600 text-xs font-semibold mb-8 tracking-wide">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Pokemon & One Piece Card Tracker
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight text-[#1a1d2e]">
              Your Cards.{' '}
              <span className="text-amber-500">
                Your Collection.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[#5c6178] max-w-2xl mx-auto mb-12 leading-relaxed">
              Track prices, showcase your collection, and stay on top of the market for Pokemon & One Piece cards.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/search"
                className="group px-8 py-4 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-400 transition-all text-lg shadow-lg shadow-amber-500/25"
              >
                Search Cards
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/collection"
                className="px-8 py-4 bg-white border border-[#e5e7ef] text-[#3a3f54] font-bold rounded-2xl hover:text-amber-500 hover:border-amber-300 transition-all text-lg"
              >
                My Collection
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 md:gap-12 text-center">
              <div>
                <div className="text-3xl font-extrabold text-[#1a1d2e]">14K+</div>
                <div className="text-sm text-[#8b8fa6] mt-1">Card Sets</div>
              </div>
              <div className="w-px h-10 bg-[#e5e7ef]" />
              <div>
                <div className="text-3xl font-extrabold text-[#1a1d2e]">Real-time</div>
                <div className="text-sm text-[#8b8fa6] mt-1">Market Prices</div>
              </div>
              <div className="w-px h-10 bg-[#e5e7ef]" />
              <div>
                <div className="text-3xl font-extrabold text-[#1a1d2e]">Free</div>
                <div className="text-sm text-[#8b8fa6] mt-1">Forever</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1d2e] mb-4 tracking-tight">
              Everything you need
            </h2>
            <p className="text-[#5c6178] max-w-xl mx-auto">
              From searching cards to tracking your portfolio — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-white border border-[#e5e7ef] rounded-2xl p-8 hover:border-amber-300 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                🔍
              </div>
              <h3 className="text-lg font-bold text-[#1a1d2e] mb-3">Instant Search</h3>
              <p className="text-[#5c6178] text-sm leading-relaxed">
                Browse thousands of Pokemon and One Piece cards with real-time data. Filter by set, rarity, type, and more.
              </p>
            </div>

            <div className="group bg-white border border-[#e5e7ef] rounded-2xl p-8 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="text-lg font-bold text-[#1a1d2e] mb-3">Price Tracking</h3>
              <p className="text-[#5c6178] text-sm leading-relaxed">
                See market prices from TCGplayer. Track low, mid, high, and market values for every card in your collection.
              </p>
            </div>

            <div className="group bg-white border border-[#e5e7ef] rounded-2xl p-8 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                💰
              </div>
              <h3 className="text-lg font-bold text-[#1a1d2e] mb-3">Portfolio P&L</h3>
              <p className="text-[#5c6178] text-sm leading-relaxed">
                See your total collection value, total invested, and profit/loss at a glance. Know exactly how your cards are performing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-t border-[#e5e7ef]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1d2e] mb-4 tracking-tight">
              Get started in seconds
            </h2>
            <p className="text-[#8b8fa6]">No setup required. Just search and add.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-xl font-bold text-amber-500 mx-auto mb-6 border border-amber-200">
                1
              </div>
              <h3 className="text-[#1a1d2e] font-bold mb-2">Search for cards</h3>
              <p className="text-[#8b8fa6] text-sm">Type any card name and browse results with live market prices.</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-xl font-bold text-amber-500 mx-auto mb-6 border border-amber-200">
                2
              </div>
              <h3 className="text-[#1a1d2e] font-bold mb-2">Add to collection</h3>
              <p className="text-[#8b8fa6] text-sm">One click to add any card. Set quantity, condition, and purchase price.</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-xl font-bold text-amber-500 mx-auto mb-6 border border-amber-200">
                3
              </div>
              <h3 className="text-[#1a1d2e] font-bold mb-2">Track your portfolio</h3>
              <p className="text-[#8b8fa6] text-sm">Watch your total value grow. See profit, loss, and individual card performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community CTA */}
      <section className="bg-[#f8f9fb] border-t border-[#e5e7ef]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-600 text-xs font-semibold mb-4">
                👥 Community
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1d2e] mb-4 tracking-tight">
                Collect together
              </h2>
              <p className="text-[#5c6178] leading-relaxed mb-6">
                See what other collectors are adding. Join the leaderboard. Share your collection. Trade cards with the community.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/community"
                  className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-400 transition-all shadow-sm shadow-amber-500/25"
                >
                  View Community
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 bg-white border border-[#e5e7ef] text-[#3a3f54] font-bold rounded-xl hover:text-amber-500 hover:border-amber-300 transition-all"
                >
                  Join Now
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white border border-[#e5e7ef] rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center text-sm">👤</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1a1d2e]">PikachuCollector</p>
                  <p className="text-xs text-[#8b8fa6]">added Charizard 1st Edition</p>
                </div>
                <span className="text-xs text-[#b0b4c8]">2m ago</span>
              </div>
              <div className="bg-white border border-[#e5e7ef] rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-sm">🏴‍☠️</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1a1d2e]">LuffyFan99</p>
                  <p className="text-xs text-[#8b8fa6]">listed for trade: OP01 Luffy</p>
                </div>
                <span className="text-xs text-[#b0b4c8]">15m ago</span>
              </div>
              <div className="bg-white border border-[#e5e7ef] rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-sm">⭐</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1a1d2e]">CardMaster</p>
                  <p className="text-xs text-[#8b8fa6]">reached 500 cards in collection</p>
                </div>
                <span className="text-xs text-[#b0b4c8]">1h ago</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white border-t border-[#e5e7ef]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1a1d2e] mb-4 tracking-tight">
              Ready to track your collection?
            </h2>
            <p className="text-[#5c6178] mb-8 max-w-xl mx-auto">
              Start building your portfolio today. Free, fast, and secure.
            </p>
            <Link
              href="/search"
              className="inline-block px-8 py-4 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-400 transition-all text-lg shadow-lg shadow-amber-500/25"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e7ef] bg-[#f8f9fb] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🃏</span>
              <span className="text-sm font-bold text-amber-500">
                TCG Vault
              </span>
            </div>
            <p className="text-xs text-[#8b8fa6]">
              Card data from Pokemon TCG API · Prices from TCGplayer · Made with ♥ by Sora
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