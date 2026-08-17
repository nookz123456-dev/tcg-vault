// Server-only store for admin-managed rarity variants.
//
// The base 267 cards come from the official API (static marvel-data.json).
// Admins can add EXTRA rarity variants (e.g. a SEC print of a Common card) that
// don't exist in the API. Those live in Vercel Edge Config (key "variants") in
// prod, or a local JSON file in dev — same adapter style as prices.
//
// getMergedCards() = base cards + admin variants (cloned from the base card,
// reusing its art, with a derived id and the new rarity).
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
  cardNo: string
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

export async function addVariant(cardNo: string, rarity: string): Promise<Variant[]> {
  const list = await readVariants()
  if (!list.some((v) => v.cardNo === cardNo && v.rarity === rarity)) {
    list.push({ cardNo, rarity })
  }
  await writeVariants(list)
  return list
}

export async function removeVariant(cardNo: string, rarity: string): Promise<Variant[]> {
  const list = (await readVariants()).filter((v) => !(v.cardNo === cardNo && v.rarity === rarity))
  await writeVariants(list)
  return list
}

// Derived id for a variant card (deterministic, URL-safe).
export function variantId(baseId: string, rarity: string) {
  return `${baseId}__${rarity}`
}

// base cards + admin-added variants
export async function getMergedCards(): Promise<MarvelCard[]> {
  const variants = await readVariants()
  const extra: MarvelCard[] = []
  for (const v of variants) {
    const base = marvelCards.find((c) => c.cardNo === v.cardNo)
    if (!base) continue
    // skip if that rarity already exists in the base data
    if (marvelCards.some((c) => c.cardNo === v.cardNo && c.rarity === v.rarity)) continue
    extra.push({ ...base, id: variantId(base.id, v.rarity), rarity: v.rarity })
  }
  return extra.length ? [...marvelCards, ...extra] : marvelCards
}

export async function getMergedCard(id: string): Promise<MarvelCard | undefined> {
  return (await getMergedCards()).find((c) => c.id === id)
}
