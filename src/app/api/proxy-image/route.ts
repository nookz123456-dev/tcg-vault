import { NextResponse } from 'next/server'

// Proxy for One Piece card images (Bandai blocks hotlinking)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 })
  }

  // Only allow Bandai One Piece domains
  if (!url.startsWith('https://www.onepiece-cardgame.com/') && 
      !url.startsWith('https://asia-en.onepiece-cardgame.com/')) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.onepiece-cardgame.com/',
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