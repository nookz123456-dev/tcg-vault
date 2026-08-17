// Build clean Marvel Hero Rush dataset from the official API for use inside the app.
// Source: https://server.marvelherorush.com/marvel/card/list  (public, no auth)
// Output: src/lib/marvel-data.json  (cards + sets, image path -> /marvel-cards/<id>.webp)
//
// Run:  node scripts/marvel-build-data.js
const fs = require('fs')
const path = require('path')

const API = 'https://server.marvelherorush.com/marvel/card/list?language=en&page=1&page_size=300'

// Friendly set metadata. SD stones per official launch (Reality/Mind/Space/Time).
const SETS = {
  BP01: { id: 'BP01', name: 'Avengers Booster', code: 'BP-01', kind: 'booster' },
  SD01: { id: 'SD01', name: 'Starter Deck: Reality', code: 'SD-01', kind: 'starter' },
  SD02: { id: 'SD02', name: 'Starter Deck: Mind', code: 'SD-02', kind: 'starter' },
  SD03: { id: 'SD03', name: 'Starter Deck: Space', code: 'SD-03', kind: 'starter' },
  SD04: { id: 'SD04', name: 'Starter Deck: Time', code: 'SD-04', kind: 'starter' },
}

async function main() {
  const res = await fetch(API, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const json = await res.json()
  const raw = json.list || []
  console.log(`Fetched ${raw.length} records (API total: ${json.total})`)

  const cards = raw.map((c) => ({
    id: c.id,
    cardNo: c.card_no,
    name: c.name,
    attribute: c.attribute || null,          // Red / Blue / Green / Yellow / '' (impact)
    cardType: c.card_type,                    // character | impact
    level: c.level ? Number(c.level) : null,
    power: c.power ? Number(c.power) : null,
    attackRange: c.attack_range !== '' ? Number(c.attack_range) : null,
    rarity: c.rarity,                         // C R SR UR MR GR SEC
    feature: c.feature || null,               // e.g. "Human/Avengers"
    effect: c.effect || '',
    environment: c.environment || '',
    series: c.product_series,                 // BP01 / SD01..SD04
    image: `/marvel-cards/${c.id}.webp`,
    imageKey: c.image?.key || null,
  }))

  // Per-set counts
  const setCounts = {}
  for (const c of cards) setCounts[c.series] = (setCounts[c.series] || 0) + 1
  const sets = Object.keys(SETS).map((id) => ({ ...SETS[id], total: setCounts[id] || 0 }))

  const out = {
    game: 'marvel',
    updatedAt: new Date().toISOString().slice(0, 10),
    total: cards.length,
    uniqueCards: new Set(cards.map((c) => c.cardNo)).size,
    sets,
    cards,
  }

  const dest = path.join(__dirname, '..', 'src', 'lib', 'marvel-data.json')
  fs.writeFileSync(dest, JSON.stringify(out, null, 0))
  console.log(`Wrote ${dest}`)
  console.log(`  cards=${cards.length} uniqueCards=${out.uniqueCards} sets=${sets.length}`)
  console.log('  sets:', sets.map((s) => `${s.id}(${s.total})`).join(' '))
}

main().catch((e) => { console.error(e); process.exit(1) })
