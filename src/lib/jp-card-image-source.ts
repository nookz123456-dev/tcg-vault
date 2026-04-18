/**
 * JP Card Image Source — Supabase Storage CDN
 * 
 * Primary: Supabase Storage CDN (self-hosted webp images)
 * Fallback: TCGdex (only if card has actual image URL from API)
 * No image: placeholder
 * 
 * Coverage: 246 sets = 17,875+ cards
 * - SV, S, SM, XY, DP, BW, LEGEND, promos (from pokemon-card.com via PTCG-database)
 * - All stored on Supabase Storage at: {SUPABASE_URL}/storage/v1/object/public/jp-card-images/{setId}/{localId}.webp
 */

const SUPABASE_URL = 'https://hezbxloxsgqwbondebjt.supabase.co'
const STORAGE_BUCKET = 'jp-card-images'

export interface JPImageResult {
  imageUrl: string | null
  proxiedUrl: string | null
  source: 'supabase-cdn' | 'tcgdex' | 'tcgdex-available' | 'none'
}

// Sets with images on Supabase CDN (SV, S, SM, XY, DP from original batch + BW, XY, LEGEND, promos)
// These are stored as webp at {SUPABASE_URL}/storage/v1/object/public/jp-card-images/{setId}/{localId}.webp
// Instead of a massive JSON mapping, we use a set-based lookup + direct CDN URL construction

// Original SV/S/SM/XY/DP sets (10,350+ cards) - from pokemon-card.com via PTCG-database
const ORIGINAL_SETS = new Set([
  'SV1S','SV1V','SV1a','SV2D','SV2P','SV2a','SV3','SV3a','SV4K','SV4M','SV4a',
  'SV5K','SV5M','SV5a','SV6','SV6a','SV7','SV7a','SV8','SV8a','SV9','SV9a',
  'SV10','SV11B','SV11W',
  'S1H','S1W','S1a','S2','S2a','S3','S3a','S4','S4a','S5I','S5R','S5a',
  'S6H','S6K','S6a','S7D','S7R','S8','S8a','S8b','S9','S9a','S10D','S10P',
  'S10a','S10b','S11','S11a','S12','S12a',
  'SM1M','SM1S','SM1p','SM2K','SM2L','SM2p','SM3H','SM3N','SM3p','SM4A','SM4S','SM4p',
  'SM5M','SM5S','SM5p','SM6','SM6a','SM6b','SM7','SM7a','SM7b','SM8','SM8a','SM8b',
  'SM9','SM9a','SM9b','SM10','SM10a','SM10b','SM11','SM11a','SM11b','SM12','SM12a',
  'SM0',
  'XY2','XY3','XY4','XY6','XY7',
  'DP1','DP2','DP3','DP4','DP5',
])

// BW era sets (1,576+ cards) - from pokemon-card.com via PTCG-database
const BW_SETS = new Set([
  'BW','BW1a','BW1b','BW2','BW3a','BW3b','BW4','BW5a','BW5b','BW6a','BW6b',
  'BW7','BW8a','BW8b','BW9','BW10','BWP',
])

// XY era full set (2,000+ cards) - from pokemon-card.com via PTCG-database
const XY_SETS = new Set([
  'XY','XY1a','XY1b','XY2','XY3','XY4','XY5a','XY5b','XY6','XY6b',
  'XY7','XY7b','XY8a','XY8b','XY9','XY10','XY11a','XY11b',
  'XYA','XYB','XYC','XYD','XYE','XYF','XYG','XYH','XYP',
])

// LEGEND era sets (from PTCG-database)
const LEGEND_SETS = new Set([
  'L1a','L1b','L2','L2Sa','L2Sb','L3','LL',
])

// Promo and special sets (from PTCG-database)
const PROMO_SETS = new Set([
  'S-P','SV-P','SA','SB','SC','SCS','SD','SEF','SGG','SH','SI','SJ','SK',
  'SLD','SLL','SN','SO','SP1','SP2','SP3','SP4','SP5','SP6','SPD','SPZ',
  'WAK','WCP','WCS23',
  'CP1','CP2','CP3','CP4','CP5','CP6','CPm','CPr','CPs',
  'MG','MA','MBD','MBG','MPS','MPS08',
  '20th','X30','Y30',
  'BGSt','BGSv','BKB','BKR','BKW','BKZ','BKc','BKt','BKv',
  'BTV','Bb','Bd','Bk','Br',
  'CLF','CLK','CLL','CS1m','CS1p','CS1t','DS','El','Em','GBR',
  'HSPm','HSPp','HSPt','HSZm','HSZp','HSZt','HSm','HSp','HSt','HXY',
  'KK','KLD','LP','M-P','M1L','M1S','MMB-P','MMB-S',
  'PBG','PPD','PPP','PW','Ran',
  'SNPo','SNPr',
])

// TCGdex-only sets (have images in TCGdex but not on our CDN yet)
// For these, the API route will use TCGdex image URL as fallback
const TCGDEX_IMAGE_SETS = new Set([
  'SVLS','SVK','SVLN',
])

// All sets with CDN images
const ALL_CDN_SETS = new Set([
  ...ORIGINAL_SETS, ...BW_SETS, ...XY_SETS, ...LEGEND_SETS, ...PROMO_SETS
])

/**
 * Look up a JP card image on Supabase CDN
 * @param setId TCGdex set ID (e.g., "SV2D", "BW1a", "XY3")
 * @param localId Card number in set (e.g., "017", "001", "27101")
 */
export function getJPCardImage(setId: string, localId: string): JPImageResult {
  const normalizedId = localId
  
  if (ALL_CDN_SETS.has(setId)) {
    const cdnUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${setId}/${normalizedId}.webp`
    return { imageUrl: cdnUrl, proxiedUrl: cdnUrl, source: 'supabase-cdn' }
  }
  
  // TCGdex sets with images available (but not on our CDN)
  if (TCGDEX_IMAGE_SETS.has(setId)) {
    return { imageUrl: null, proxiedUrl: null, source: 'tcgdex-available' }
  }
  
  return { imageUrl: null, proxiedUrl: null, source: 'none' }
}

/**
 * Check if a set has JP images available on CDN
 */
export function setHasJPImages(setId: string): boolean {
  return ALL_CDN_SETS.has(setId)
}

/**
 * Get all available sets with CDN images
 */
export function getAvailableJPSets(): string[] {
  return Array.from(ALL_CDN_SETS).sort()
}

/**
 * Get total number of sets with CDN images
 */
export function getCdnSetCount(): number {
  return ALL_CDN_SETS.size
}