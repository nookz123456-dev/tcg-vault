// Download + resize all Marvel Hero Rush card images to public/marvel-cards/<id>.webp
// Source images are ~5MB PNGs on a signed CDN (tokens expire), so we re-fetch fresh
// URLs from the API right before downloading, then compress to ~600px webp.
// Resumable: skips files that already exist. Run: node scripts/marvel-download-images.js
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const API = 'https://server.marvelherorush.com/marvel/card/list?language=en&page=1&page_size=300'
const OUT = path.join(__dirname, '..', 'public', 'marvel-cards')
const WIDTH = 600
const CONCURRENCY = 6

async function fetchList() {
  const res = await fetch(API, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return (await res.json()).list || []
}

async function processOne(card) {
  const dest = path.join(OUT, `${card.id}.webp`)
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return 'skip'
  const url = card.image?.url
  if (!url) return 'nourl'
  const r = await fetch(url)
  if (!r.ok) throw new Error(`img ${r.status} for ${card.card_no}`)
  const buf = Buffer.from(await r.arrayBuffer())
  await sharp(buf)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(dest)
  return 'done'
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const list = await fetchList()
  console.log(`To process: ${list.length} images -> ${OUT}`)
  let done = 0, skip = 0, fail = 0, i = 0
  async function worker() {
    while (i < list.length) {
      const card = list[i++]
      try {
        const r = await processOne(card)
        if (r === 'done') done++; else if (r === 'skip') skip++
      } catch (e) {
        fail++
        console.error(`FAIL ${card.card_no}: ${e.message}`)
      }
      const total = done + skip + fail
      if (total % 20 === 0) console.log(`  progress ${total}/${list.length}  (done=${done} skip=${skip} fail=${fail})`)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  console.log(`DONE. done=${done} skip=${skip} fail=${fail} total=${list.length}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
