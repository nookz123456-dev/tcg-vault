'use client'

// Wishlist store — a swappable storage layer.
// v1: browser localStorage (works with no login). When the account backend is
// ready, only the read/write internals here change; components stay the same.
import { useEffect, useState, useCallback } from 'react'

const KEY = 'mhr_wishlist'
const EVT = 'mhr_wishlist_change'

function read(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function write(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids))
  // notify every hook instance in this tab (storage event only fires cross-tab)
  window.dispatchEvent(new CustomEvent(EVT))
}

export function useWishlist() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    setIds(read())
    const sync = () => setIds(read())
    window.addEventListener(EVT, sync)
    window.addEventListener('storage', sync) // cross-tab
    return () => {
      window.removeEventListener(EVT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const has = useCallback((id: string) => ids.includes(id), [ids])

  const toggle = useCallback((id: string) => {
    const cur = read()
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    write(next)
    setIds(next)
  }, [])

  const remove = useCallback((id: string) => {
    const next = read().filter((x) => x !== id)
    write(next)
    setIds(next)
  }, [])

  const clear = useCallback(() => {
    write([])
    setIds([])
  }, [])

  return { ids, count: ids.length, has, toggle, remove, clear }
}
