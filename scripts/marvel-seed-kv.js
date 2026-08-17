// Push local prices (data/marvel-prices.json) up to Vercel KV in one shot.
//
// Workflow: set prices locally at http://localhost:3000/admin/marvel-prices
// (fast, file-backed), then run this to sync the whole file into production KV.
//
// Requires KV credentials in the environment or .env.local:
//   KV_REST_API_URL + KV_REST_API_TOKEN   (or the UPSTASH_REDIS_REST_* names)
// Get them after connecting the KV store on Vercel:
//   npx vercel env pull .env.local     (or copy from Vercel ▸ Storage ▸ .env.local)
//
// Run:  node scripts/marvel-seed-kv.js
const fs = require('fs')
const path = require('path')

// Load .env.local into process.env (simple parser, doesn't overwrite existing).
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const KV_KEY = 'marvel:prices:v1'

async function main() {
  if (!url || !token) {
    console.error('❌ ไม่พบ KV credentials (KV_REST_API_URL / KV_REST_API_TOKEN)')
    console.error('   วิธีได้มา: เชื่อม KV บน Vercel แล้วรัน  npx vercel env pull .env.local')
    console.error('   หรือก๊อป KV_REST_API_URL + KV_REST_API_TOKEN จาก Vercel ▸ Storage ใส่ .env.local')
    process.exit(1)
  }

  const file = path.join(__dirname, '..', 'data', 'marvel-prices.json')
  const store = JSON.parse(fs.readFileSync(file, 'utf8'))
  const count = Object.keys(store.prices || {}).length
  console.log(`📄 อ่านจากไฟล์: ${count} ราคา (updatedAt ${store.updatedAt})`)
  if (count === 0) {
    console.error('⚠️  ไฟล์ยังไม่มีราคา — ไปตั้งที่ localhost:3000/admin/marvel-prices ก่อน')
    process.exit(1)
  }

  const { createClient } = await import('@vercel/kv')
  const kv = createClient({ url, token })
  await kv.set(KV_KEY, store)

  const check = await kv.get(KV_KEY)
  const wrote = Object.keys(check?.prices || {}).length
  console.log(`✅ เขียนลง KV สำเร็จ: ${wrote} ราคา ที่คีย์ "${KV_KEY}"`)
  console.log('   → เว็บจริงจะโชว์ราคาเหล่านี้ทันที')
}

main().catch((e) => { console.error(e); process.exit(1) })
