import { NextResponse } from 'next/server'

// Proxy for card images (Bandai blocks hotlinking, pokemon-card.com and optcgapi.com have no CORS headers)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 })
  }

  // Allowed domains for image proxy
  const allowedDomains = [
    'https://www.onepiece-cardgame.com/',
    'https://asia-en.onepiece-cardgame.com/',
    'https://www.pokemon-card.com/',
    'https://optcgapi.com/',
    'https://assets.tcgdex.net/',
  ]

  if (!allowedDomains.some(domain => url.startsWith(domain))) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
  }

  // Determine referer based on domain
  let referer = 'https://www.onepiece-cardgame.com/'
  if (url.startsWith('https://www.pokemon-card.com/')) {
    referer = 'https://www.pokemon-card.com/'
  } else if (url.startsWith('https://optcgapi.com/')) {
    referer = 'https://optcgapi.com/'
  } else if (url.startsWith('https://assets.tcgdex.net/')) {
    referer = 'https://www.tcgdex.net/'
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': referer,
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: res.status })
    }

    const contentType = res.headers.get('content-type') || 'image/png'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (e) {
    console.error('Image proxy error:', e)
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}