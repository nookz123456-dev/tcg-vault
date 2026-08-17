// Server-only price store for Marvel Hero Rush cards.
//
// Adapter: uses Vercel Edge Config in production (reads at the edge, writes via
// the Vercel API), and falls back to a local JSON file for dev. The rest of the
// app calls getMarvelPrices() / saveMarvelPrices() and is storage-agnostic.
//
// Env (set on Vercel):
//   EDGE_CONFIG              read connection string (auto-used by the SDK)
//   EDGE_CONFIG_ID           the edge config id (for writes)
//   VERCEL_TEAM_ID           team id (for the write API)
//   VERCEL_EDGE_WRITE_TOKEN  Vercel token used to PATCH items (write path only)
//
// NOTE: server-only — import from server components / route handlers only.
import { promises as fs } from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'marvel-prices.json')
const EDGE_KEY = 'prices'

const EDGE_ID = process.env.EDGE_CONFIG_ID
const EDGE_TEAM = process.env.VERCEL_TEAM_ID
const EDGE_WRITE_TOKEN = process.env.VERCEL_EDGE_WRITE_TOKEN
const useEdge = Boolean(process.env.EDGE_CONFIG && EDGE_ID)

export interface PriceStore {
  updatedAt: string | null
  prices: Record<string, number> // card id -> median price (THB)
}

async function readStore(): Promise<PriceStore> {
  if (useEdge) {
    try {
      const { get } = await import('@vercel/edge-config')
      const data = (await get(EDGE_KEY)) as PriceStore | undefined
      return { updatedAt: data?.updatedAt ?? null, prices: data?.prices ?? {} }
    } catch {
      return { updatedAt: null, prices: {} }
    }
  }
  try {
    const raw = await fs.readFile(FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return { updatedAt: parsed.updatedAt ?? null, prices: parsed.prices ?? {} }
  } catch {
    return { updatedAt: null, prices: {} }
  }
}

async function writeStore(store: PriceStore): Promise<void> {
  if (useEdge) {
    if (!EDGE_WRITE_TOKEN) {
      throw new Error('ยังตั้งค่าการบันทึกบนเว็บจริงไม่ครบ (ไม่มี write token)')
    }
    const res = await fetch(
      `https://api.vercel.com/v1/edge-config/${EDGE_ID}/items?teamId=${EDGE_TEAM}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${EDGE_WRITE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ operation: 'upsert', key: EDGE_KEY, value: store }] }),
      }
    )
    if (!res.ok) {
      throw new Error(`บันทึกไม่สำเร็จ (Edge Config ${res.status})`)
    }
    return
  }
  try {
    await fs.writeFile(FILE, JSON.stringify(store, null, 0))
  } catch {
    throw new Error('บันทึกบนเซิร์ฟเวอร์ไม่ได้ (ไฟล์อ่านอย่างเดียว)')
  }
}

// Public: map of card id -> price. Read fresh each call so admin edits show up.
export async function getMarvelPrices(): Promise<Record<string, number>> {
  return (await readStore()).prices
}

export async function getMarvelPriceStore(): Promise<PriceStore> {
  return readStore()
}

// Upsert a batch of prices. A null/undefined value clears that card's price.
export async function saveMarvelPrices(
  updates: Record<string, number | null>
): Promise<PriceStore> {
  const store = await readStore()
  for (const [id, val] of Object.entries(updates)) {
    if (val == null || Number.isNaN(val)) delete store.prices[id]
    else store.prices[id] = Math.round(val)
  }
  store.updatedAt = new Date().toISOString()
  await writeStore(store)
  return store
}
