'use client'

import { useState, useEffect } from 'react'

export interface LocalCard {
  id: string
  cardId: string
  game: 'pokemon' | 'onepiece'
  name: string
  imageUrl: string
  setName: string
  rarity: string | null
  quantity: number
  condition: string
  purchasePrice: number | null
  marketPrice: number | null
  addedAt: string
}

const STORAGE_KEY = 'tcg-vault-collection'

export function useLocalCollection() {
  const [cards, setCards] = useState<LocalCard[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setCards(JSON.parse(stored))
      } catch {
        setCards([])
      }
    }
    setIsLoaded(true)
  }, [])

  const saveCards = (newCards: LocalCard[]) => {
    setCards(newCards)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCards))
  }

  const addCard = (card: LocalCard) => {
    const existing = cards.find(c => c.cardId === card.cardId && c.game === card.game && c.condition === card.condition)
    if (existing) {
      const updated = cards.map(c =>
        c.id === existing.id
          ? { ...c, quantity: c.quantity + 1 }
          : c
      )
      saveCards(updated)
    } else {
      saveCards([...cards, card])
    }
  }

  const removeCard = (id: string) => {
    saveCards(cards.filter(c => c.id !== id))
  }

  const updateCard = (id: string, updates: Partial<LocalCard>) => {
    saveCards(cards.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const totalValue = cards.reduce((sum, c) => {
    const price = c.marketPrice || c.purchasePrice || 0
    return sum + (price * c.quantity)
  }, 0)

  const totalInvested = cards.reduce((sum, c) => {
    const price = c.purchasePrice || 0
    return sum + (price * c.quantity)
  }, 0)

  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0)

  return {
    cards,
    isLoaded,
    addCard,
    removeCard,
    updateCard,
    totalValue,
    totalInvested,
    totalCards,
  }
}