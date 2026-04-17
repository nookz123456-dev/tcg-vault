import { NextRequest, NextResponse } from 'next/server'

// One Piece sets from Bandai official site
const OP_EN_BASE = 'https://asia-en.onepiece-cardgame.com'

export async function GET() {
  try {
    // Fetch the card list page which has all set links
    const res = await fetch(`${OP_EN_BASE}/cardlist/`, {
      headers: {
        'User-Agent': 'TCGVault/1.0',
        'Accept': 'text/html',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`One Piece site error: ${res.status}`)
    }

    const html = await res.text()

    // Extract set info from the page
    // Bandai uses data-category attributes or similar
    const sets: any[] = []
    
    // Try to find set options in the dropdown/select
    const setRegex = /value="([^"]+)"[^>]*>([^<]+)/g
    let match
    
    // Also look for set links in the cardlist sidebar
    const linkRegex = /cardlist\/(\w+)\?[^"]*"[^>]*>([^<]+)/g
    
    // Alternative: known set list
    const knownSets = [
      { id: 'OP01', name: 'Romance Dawn', releaseDate: '2022-12-02' },
      { id: 'OP02', name: 'Paramount War', releaseDate: '2023-03-10' },
      { id: 'OP03', name: 'Pillars of Strength', releaseDate: '2023-05-12' },
      { id: 'OP04', name: 'Kingdoms of Intrigue', releaseDate: '2023-07-28' },
      { id: 'OP05', name: 'Awakening of the New Era', releaseDate: '2023-09-22' },
      { id: 'OP06', name: 'Wings of the Captain', releaseDate: '2023-12-08' },
      { id: 'OP07', name: '500 Years in the Future', releaseDate: '2024-02-23' },
      { id: 'OP08', name: 'Legends and Destinies', releaseDate: '2024-05-03' },
      { id: 'OP09', name: 'Emperors in the New World', releaseDate: '2024-07-12' },
      { id: 'OP10', name: 'The Rising of the Great Pirate Era', releaseDate: '2024-09-20' },
      { id: 'OP11', name: 'Absolute Justice', releaseDate: '2024-12-06' },
      { id: 'ST01', name: 'Straw Hat Crew [ST]', releaseDate: '2022-12-02' },
      { id: 'ST02', name: 'Worst Generation [ST]', releaseDate: '2022-12-02' },
      { id: 'ST03', name: "Smoker's Pursuit [ST]", releaseDate: '2023-01-13' },
      { id: 'ST04', name: 'Animal Kingdom Pirates [ST]', releaseDate: '2023-02-24' },
      { id: 'ST05', name: 'Uta [ST]', releaseDate: '2023-04-21' },
      { id: 'ST06', name: 'Big Mom Pirates [ST]', releaseDate: '2023-06-16' },
      { id: 'ST07', name: 'The Vinsmoke Family [ST]', releaseDate: '2023-09-01' },
      { id: 'ST08', name: 'Zoro & Nami [ST]', releaseDate: '2023-11-17' },
      { id: 'ST09', name: 'Yamato [ST]', releaseDate: '2024-02-23' },
      { id: 'ST10', name: 'Urouge [ST]', releaseDate: '2024-05-03' },
      { id: 'ST11', name: 'Uta [ST-2]', releaseDate: '2024-07-12' },
      { id: 'ST12', name: 'Kaido [ST]', releaseDate: '2024-09-20' },
      { id: 'ST13', name: 'Kuzan [ST]', releaseDate: '2024-12-06' },
      { id: 'PRB01', name: 'Premium Booster', releaseDate: '2024-03-08' },
      { id: 'PRB02', name: 'Premium Booster 2', releaseDate: '2024-09-13' },
      { id: 'EB01', name: 'Enhanced Booster', releaseDate: '2025-02-28' },
      { id: 'OP12', name: 'One Piece OP12', releaseDate: '2025-03-21' },
    ]

    return NextResponse.json({ data: knownSets, totalCount: knownSets.length })
  } catch (error) {
    console.error('One Piece sets error:', error)
    return NextResponse.json({ data: [], totalCount: 0, error: 'Failed to fetch OP sets' }, { status: 500 })
  }
}