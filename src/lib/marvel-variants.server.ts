// Server-only store for admin rarity OVERRIDES (moves).
//
// The base 267 cards come from the official API (static marvel-data.json).
// Admins can MOVE a card to a different rarity — one override per card number,
// applied in place. No clones, no duplicates. Stored in Vercel Edge Config
// (key "variants") in prod, or a local JSON file in dev — same adapter as prices.
//
// getMergedCards() = base cards with those rarity overrides applied.
//
// NOTE: server-only — import from server components / route handlers only.
import { promises as fs } from 'fs'
import path from 'path'
import { marvelCards, type MarvelCard } from './marvel'

const FILE = path.join(process.cwd(), 'data', 'marvel-variants.json')
const EDGE_KEY = 'variants'

const EDGE_ID = process.env.EDGE_CONFIG_ID
const EDGE_TEAM = process.env.VERCEL_TEAM_ID
const EDGE_WRITE_TOKEN = process.env.VERCEL_EDGE_WRITE_TOKEN
const useEdge = Boolean(process.env.EDGE_CONFIG && EDGE_ID)

export interface Variant {
  id?: string      // base card id (precise, per-print). Legacy entries may omit it.
  cardNo: string   // kept for display + legacy fallback
  rarity: string
}

async function readVariants(): Promise<Variant[]> {
  if (useEdge) {
    try {
      const { get } = await import('@vercel/edge-config')
      const v = (await get(EDGE_KEY)) as Variant[] | undefined
      return Array.isArray(v) ? v : []
    } catch {
      return []
    }
  }
  try {
    const raw = await fs.readFile(FILE, 'utf8')
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

async function writeVariants(list: Variant[]): Promise<void> {
  if (useEdge) {
    if (!EDGE_WRITE_TOKEN) throw new Error('ยังตั้งค่าการบันทึกบนเว็บจริงไม่ครบ (ไม่มี write token)')
    const res = await fetch(
      `https://api.vercel.com/v1/edge-config/${EDGE_ID}/items?teamId=${EDGE_TEAM}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${EDGE_WRITE_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ operation: 'upsert', key: EDGE_KEY, value: list }] }),
      }
    )
    if (!res.ok) throw new Error(`บันทึกไม่สำเร็จ (Edge Config ${res.status})`)
    return
  }
  try {
    await fs.writeFile(FILE, JSON.stringify(list, null, 0))
  } catch {
    throw new Error('บันทึกบนเซิร์ฟเวอร์ไม่ได้ (ไฟล์อ่านอย่างเดียว)')
  }
}

export async function getVariants(): Promise<Variant[]> {
  return readVariants()
}

// Move ONE card (by its unique id) to a rarity. Upsert: one override per id,
// so re-applying just changes the target rarity (never duplicates). Keyed by id
// so parallel prints that share a card number are moved independently.
export async function addVariant(id: string, cardNo: string, rarity: string): Promise<Variant[]> {
  const list = await readVariants()
  const existing = list.find((v) => v.id === id)
  if (existing) existing.rarity = rarity
  else list.push({ id, cardNo, rarity })
  await writeVariants(list)
  return list
}

// Reset a card back to its original rarity (remove its override).
// Matches by id, plus legacy card-number entries (which have no id).
export async function removeVariant(id: string, cardNo?: string): Promise<Variant[]> {
  const list = (await readVariants()).filter((v) => !(v.id === id || (!v.id && v.cardNo === cardNo)))
  await writeVariants(list)
  return list
}

// base cards with admin rarity overrides applied in place (no clones, no dups).
// Prefer per-id overrides; fall back to legacy per-cardNo entries (no id).
export async function getMergedCards(): Promise<MarvelCard[]> {
  const overrides = await readVariants()
  if (!overrides.length) return marvelCards
  const byId = new Map<string, string>()
  const byCardNo = new Map<string, string>()
  for (const o of overrides) {
    if (o.id) byId.set(o.id, o.rarity)
    else byCardNo.set(o.cardNo, o.rarity)
  }
  return marvelCards.map((c) =>
    byId.has(c.id) ? { ...c, rarity: byId.get(c.id)! }
    : byCardNo.has(c.cardNo) ? { ...c, rarity: byCardNo.get(c.cardNo)! }
    : c
  )
}

export async function getMergedCard(id: string): Promise<MarvelCard | undefined> {
  return (await getMergedCards()).find((c) => c.id === id)
}
