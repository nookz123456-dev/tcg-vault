import Link from 'next/link'
import TrendingCarousel from '@/components/TrendingCarousel'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Navigation */}
      <nav className="border-b border-[var(--card-border)] bg-[var(--surface-1)]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="text-2xl transition-transform group-hover:scale-110">🃏</span>
              <span className="text-xl font-bold text-amber-400 tracking-tight">
                TCG Vault
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/search" className="text-sm text-[var(--warm-300)] hover:text-amber-400 transition-colors font-medium">
                Search
              </Link>
              <Link href="/collection" className="text-sm text-[var(--warm-300)] hover:text-amber-400 transition-colors font-medium">
                Collection
              </Link>
              <Link
                href="/login"
                className="text-sm px-5 py-2 bg-amber-500 text-[var(--warm-900)] font-bold rounded-xl hover:bg-amber-400 transition-all"
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
        {/* Warm ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-amber-500/[0.06] rounded-full blur-[150px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-semibold mb-8 tracking-wide">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              Pokemon & One Piece Card Tracker
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
              <span className="text-[var(--foreground)]">Your Cards. </span>
              <span className="text-amber-400">
                Your Collection.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--warm-300)] max-w-2xl mx-auto mb-12 leading-relaxed">
              Track prices, showcase your collection, and stay on top of the market for Pokemon & One Piece cards.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/search"
                className="group px-8 py-4 bg-amber-500 text-[var(--warm-900)] font-bold rounded-2xl hover:bg-amber-400 transition-all text-lg shadow-lg shadow-amber-500/20"
              >
                Search Cards
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/collection"
                className="px-8 py-4 bg-[var(--surface-1)] border border-[var(--card-border)] text-[var(--warm-200)] font-bold rounded-2xl hover:text-amber-400 hover:border-amber-500/30 transition-all text-lg"
              >
                My Collection
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 md:gap-12 text-center">
              <div>
                <div className="text-3xl font-extrabold text-[var(--foreground)]">14K+</div>
                <div className="text-sm text-[var(--warm-400)] mt-1">Card Sets</div>
              </div>
              <div className="w-px h-10 bg-[var(--card-border)]" />
              <div>
                <div className="text-3xl font-extrabold text-[var(--foreground)]">Real-time</div>
                <div className="text-sm text-[var(--warm-400)] mt-1">Market Prices</div>
              </div>
              <div className="w-px h-10 bg-[var(--card-border)]" />
              <div>
                <div className="text-3xl font-extrabold text-[var(--foreground)]">Free</div>
                <div className="text-sm text-[var(--warm-400)] mt-1">Forever</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)] mb-4 tracking-tight">
              Everything you need
            </h2>
            <p className="text-[var(--warm-300)] max-w-xl mx-auto">
              From searching cards to tracking your portfolio — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 hover:border-amber-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                🔍
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-3">Instant Search</h3>
              <p className="text-[var(--warm-300)] text-sm leading-relaxed">
                Browse thousands of Pokemon and One Piece cards with real-time data. Filter by set, rarity, type, and more.
              </p>
            </div>

            <div className="group bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-3">Price Tracking</h3>
              <p className="text-[var(--warm-300)] text-sm leading-relaxed">
                See market prices from TCGplayer. Track low, mid, high, and market values for every card in your collection.
              </p>
            </div>

            <div className="group bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 hover:border-blue-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform">
                💰
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-3">Portfolio P&L</h3>
              <p className="text-[var(--warm-300)] text-sm leading-relaxed">
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
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)] mb-4 tracking-tight">
              Get started in seconds
            </h2>
            <p className="text-[var(--warm-400)]">No setup required. Just search and add.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-amber-500/15 rounded-2xl flex items-center justify-center text-xl font-bold text-amber-400 mx-auto mb-6 border border-amber-500/20">
                1
              </div>
              <h3 className="text-[var(--foreground)] font-bold mb-2">Search for cards</h3>
              <p className="text-[var(--warm-400)] text-sm">Type any card name and browse results with live market prices.</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-amber-500/15 rounded-2xl flex items-center justify-center text-xl font-bold text-amber-400 mx-auto mb-6 border border-amber-500/20">
                2
              </div>
              <h3 className="text-[var(--foreground)] font-bold mb-2">Add to collection</h3>
              <p className="text-[var(--warm-400)] text-sm">One click to add any card. Set quantity, condition, and purchase price.</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-amber-500/15 rounded-2xl flex items-center justify-center text-xl font-bold text-amber-400 mx-auto mb-6 border border-amber-500/20">
                3
              </div>
              <h3 className="text-[var(--foreground)] font-bold mb-2">Track your portfolio</h3>
              <p className="text-[var(--warm-400)] text-sm">Watch your total value grow. See profit, loss, and individual card performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-[var(--card-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-[var(--surface-1)] border border-[var(--card-border)] rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--foreground)] mb-4 tracking-tight">
              Ready to track your collection?
            </h2>
            <p className="text-[var(--warm-300)] mb-8 max-w-xl mx-auto">
              Start building your portfolio today. Free, fast, and secure.
            </p>
            <Link
              href="/search"
              className="inline-block px-8 py-4 bg-amber-500 text-[var(--warm-900)] font-bold rounded-2xl hover:bg-amber-400 transition-all text-lg shadow-lg shadow-amber-500/20"
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
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🃏</span>
              <span className="text-sm font-bold text-amber-400">
                TCG Vault
              </span>
            </div>
            <p className="text-xs text-[var(--warm-500)]">
              Card data from Pokemon TCG API · Prices from TCGplayer · Made with ♥ by Sora
            </p>
            <div className="flex items-center gap-4 text-xs text-[var(--warm-500)]">
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