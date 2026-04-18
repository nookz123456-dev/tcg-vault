/**
 * JP Card Image Source — pokemon-card.com (Official JP Pokemon TCG Site)
 * 
 * Provides authentic Japanese card images from pokemon-card.com
 * Coverage: 99+ sets (SV, S, SM, XY partial, DP)
 * 
 * URL Pattern: https://www.pokemon-card.com/assets/images/card_images/large/{SET}/{JP_ID}_P_{NAME}.jpg
 * 
 * This module loads a pre-built mapping from PTCG-database data_jp JSON files
 * which maps TCGdex set+number → pokemon-card.com image URL
 * 
 * Since pokemon-card.com doesn't send CORS headers, all images must be
 * proxied through /api/proxy-image?url=...
 */

import jpCardImages from './jp-card-images.json'

export interface JPImageResult {
  imageUrl: string | null        // Direct pokemon-card.com URL (needs proxy)
  proxiedUrl: string | null      // Proxied URL via /api/proxy-image
  source: 'pokemon-card-jp' | 'tcgdex' | 'none'
}

/**
 * Look up a JP card image from the pre-built mapping
 * @param setId TCGdex set ID (e.g., "SV2D", "SM1M", "S12a")
 * @param localId Card number in set (e.g., "017", "001")
 * @returns Image result with direct and proxied URLs
 */
export function getJPCardImage(setId: string, localId: string): JPImageResult {
  // Normalize localId to 3-digit zero-padded
  const normalizedId = localId.padStart(3, '0')
  const key = `${setId}/${normalizedId}`
  
  const mapping = (jpCardImages as Record<string, { img: string; name: string; jp_id: number }>)[key]
  
  if (mapping?.img) {
    const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(mapping.img)}`
    return {
      imageUrl: mapping.img,
      proxiedUrl,
      source: 'pokemon-card-jp'
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
 * @param setId TCGdex set ID
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