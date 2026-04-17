import { Suspense } from 'react'
import SearchResults from './SearchResults'

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#5c6078]">Loading...</div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  )
}