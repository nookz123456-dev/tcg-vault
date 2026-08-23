'use client'

// Deck store — swappable storage layer (localStorage now, account-sync later).
// A deck = { id, name, cards: { [cardId]: qty } }. Supports multiple decks.
import { useEffect, useState, useCallback } from 'react'

const KEY = 'mhr_decks'
const EVT = 'mhr_decks_change'

export interface Deck {
  id: string
  name: string
  cards: Record<string, number>
  updatedAt: number
}

function read(): Deck[] {
  if (typeof window === 'undefined') return []
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function write(decks: Deck[]) {
  localStorage.setItem(KEY, JSON.stringify(decks))
  window.dispatchEvent(new CustomEvent(EVT))
}

const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `d${Date.now()}${Math.random().toString(36).slice(2, 8)}`

export function deckCount(d: Deck) {
  return Object.values(d.cards).reduce((a, b) => a + b, 0)
}

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([])

  useEffect(() => {
    setDecks(read())
    const sync = () => setDecks(read())
    window.addEventListener(EVT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const save = (next: Deck[]) => { write(next); setDecks(next) }

  const createDeck = useCallback((name: string) => {
    const deck: Deck = { id: uid(), name: name.trim() || 'เด็คใหม่', cards: {}, updatedAt: Date.now() }
    save([...read(), deck])
    return deck.id
  }, [])

  const deleteDeck = useCallback((id: string) => save(read().filter((d) => d.id !== id)), [])

  const renameDeck = useCallback((id: string, name: string) =>
    save(read().map((d) => (d.id === id ? { ...d, name: name.trim() || d.name, updatedAt: Date.now() } : d))), [])

  const changeQty = useCallback((id: string, cardId: string, delta: number) =>
    save(read().map((d) => {
      if (d.id !== id) return d
      const cards = { ...d.cards }
      const q = (cards[cardId] || 0) + delta
      if (q <= 0) delete cards[cardId]
      else cards[cardId] = q
      return { ...d, cards, updatedAt: Date.now() }
    })), [])

  const removeCard = useCallback((id: string, cardId: string) =>
    save(read().map((d) => {
      if (d.id !== id) return d
      const cards = { ...d.cards }
      delete cards[cardId]
      return { ...d, cards, updatedAt: Date.now() }
    })), [])

  return { decks, createDeck, deleteDeck, renameDeck, changeQty, removeCard }
}
