// Server-only price store for Marvel Hero Rush cards.
//
// Adapter: uses Vercel KV (Redis) in production when its env vars are present,
// otherwise falls back to a local JSON file (data/marvel-prices.json) for dev.
// The rest of the app calls getMarvelPrices() / saveMarvelPrices() and is
// agnostic to where prices live.
//
// On Vercel: add a KV / Upstash Redis store and connect it to the project —
// Vercel injects KV_REST_API_URL + KV_REST_API_TOKEN (or the UPSTASH_* names),
// and this file switches to KV automatically. Local dev keeps using the file.
//
// NOTE: server-only — import from server components / route handlers only.
import { promises as fs } from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'marvel-prices.json')
const KV_KEY = 'marvel:prices:v1'

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const useKV = Boolean(KV_URL && KV_TOKEN)

export interface PriceStore {
  updatedAt: string | null
  prices: Record<string, number> // card id -> median price (THB)
}

// Lazily create the KV client only when needed (keeps it out of dev bundles).
async function kvClient() {
  const { createClient } = await import('@vercel/kv')
  return createClient({ url: KV_URL!, token: KV_TOKEN! })
}

async function readStore(): Promise<PriceStore> {
  if (useKV) {
    try {
      const kv = await kvClient()
      const data = await kv.get<PriceStore>(KV_KEY)
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
  if (useKV) {
    const kv = await kvClient()
    await kv.set(KV_KEY, store)
    return
  }
  try {
    await fs.writeFile(FILE, JSON.stringify(store, null, 0))
  } catch {
    // Vercel's filesystem is read-only — writing needs a KV store.
    throw new Error(
      'บันทึกบนเว็บจริงยังไม่ได้ — ต้องตั้งค่า Vercel KV ก่อน (หรือแก้ราคาที่ localhost แล้ว redeploy)'
    )
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
