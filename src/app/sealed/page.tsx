'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

interface SealedProduct {
  id: string
  name: string
  series: string
  releaseDate: string
  logo: string
  symbol: string
  printedTotal: number
  total: number
  updatedAt: string
  products: Array<{ type: string; url: string }>
}

export default function SealedPage() {
  const [products, setProducts] = useState<SealedProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sealed')
      .then(r => r.json())
      .then(data => {
        setProducts(data.products || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
            <h1 className="text-3xl font-bold text-[#1e2235]">Sealed Products</h1>
          </div>
          <p className="text-[#5c6078] ml-5">Booster boxes, Elite Trainer Boxes, and more — latest sets</p>
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden">
                <div className="shimmer h-32" />
                <div className="p-5 space-y-2">
                  <div className="shimmer h-5 w-3/4 rounded" />
                  <div className="shimmer h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map(product => (
              <div
                key={product.id}
                className="bg-white border border-[#e8eaf0] rounded-2xl overflow-hidden hover:border-[#6366f1]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#6366f1]/5 hover:-translate-y-0.5"
              >
                {/* Set logo */}
                <div className="h-32 bg-gradient-to-br from-[#f5f6fa] to-[#e8eaf0] flex items-center justify-center p-4">
                  <img
                    src={product.logo}
                    alt={product.name}
                    className="max-h-24 max-w-full object-contain"
                    loading="lazy"
                  />
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-[#1e2235]">{product.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#5c6078]">
                    <span>{product.series}</span>
                    <span className="text-gray-600">·</span>
                    <span>{new Date(product.releaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                  <p className="text-xs text-[#8b8fa6] mt-1">
                    {product.printedTotal} cards
                  </p>

                  {/* Product types */}
                  <div className="mt-4 space-y-2">
                    {product.products.map(p => (
                      <a
                        key={p.type}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2 bg-[#f5f6fa] border border-[#e8eaf0] rounded-xl text-sm hover:border-[#6366f1]/30 hover:text-[#6366f1] transition-all group"
                      >
                        <span className="text-[#3b3f56] group-hover:text-[#6366f1] font-medium">{p.type}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8b8fa6] group-hover:text-[#6366f1]">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}