/**
 * JP Card Image Source — Supabase Storage CDN + pokemon-card.com fallback
 * 
 * Primary: Supabase Storage CDN (self-hosted webp images, ~50KB each)
 * Fallback: pokemon-card.com via /api/proxy-image proxy
 * 
 * Coverage: 100 sets (SV, S, SM, XY, DP) = 10,350+ cards
 * Images stored at: {SUPABASE_URL}/storage/v1/object/public/jp-card-images/{setId}/{localId}.webp
 */

import jpCardImages from './jp-card-images.json'

const SUPABASE_URL = 'https://hezbxloxsgqwbondebjt.supabase.co'
const STORAGE_BUCKET = 'jp-card-images'

export interface JPImageResult {
  imageUrl: string | null        // Direct CDN URL (Supabase Storage)
  proxiedUrl: string | null      // Same as imageUrl for CDN (no proxy needed)
  source: 'supabase-cdn' | 'pokemon-card-jp' | 'tcgdex' | 'none'
}

/**
 * Look up a JP card image
 * Priority:
 * 1. Supabase Storage CDN (self-hosted webp) — fastest, no proxy needed
 * 2. pokemon-card.com via proxy — original source, higher quality but needs proxy
 * 
 * @param setId TCGdex set ID (e.g., "SV2D", "SM1M", "S12a")
 * @param localId Card number in set (e.g., "017", "001")
 */
export function getJPCardImage(setId: string, localId: string): JPImageResult {
  // Normalize localId to 3-digit zero-padded
  const normalizedId = localId.padStart(3, '0')
  const key = `${setId}/${normalizedId}`
  
  const mapping = (jpCardImages as Record<string, { img: string; name: string; jp_id: number }>)[key]
  
  if (mapping?.img) {
    // Priority 1: Supabase Storage CDN (self-hosted webp)
    const cdnUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${setId}/${normalizedId}.webp`
    
    return {
      imageUrl: cdnUrl,
      proxiedUrl: cdnUrl,  // CDN URL doesn't need proxy
      source: 'supabase-cdn'
    }
  }
  
  // Not found in mapping — will fall back to TCGdex or EN image
  return {
    imageUrl: null,
    proxiedUrl: null,
    source: 'none'
  }
}

/**
 * Check if a set has JP images available in the mapping
 */
export function setHasJPImages(setId: string): boolean {
  const prefix = `${setId}/`
  return Object.keys(jpCardImages as Record<string, unknown>).some(k => k.startsWith(prefix))
}

/**
 * Get all available sets in the mapping
 */
export function getAvailableJPSets(): string[] {
  const sets = new Set<string>()
  for (const key of Object.keys(jpCardImages as Record<string, unknown>)) {
    const setId = key.split('/')[0]
    sets.add(setId)
  }
  return Array.from(sets).sort()
}