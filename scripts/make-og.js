// Generates public/og.jpg (1200x630) — the social/link-preview image.
// Official key art (darkened) + HERORUSH logo + association logo. Run: node scripts/make-og.js
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const B = path.join(__dirname, '..', 'public', 'brand')

;(async () => {
  const W = 1200, H = 630
  const bg = await sharp(path.join(B, 'hero-bg.webp')).resize(W, H, { fit: 'cover', position: 'centre' }).toBuffer()
  const overlay = Buffer.from(`<svg width="${W}" height="${H}">
    <defs>
      <radialGradient id="g" cx="50%" cy="40%" r="75%">
        <stop offset="0%" stop-color="rgba(8,8,15,0.12)"/>
        <stop offset="62%" stop-color="rgba(8,8,15,0.80)"/>
        <stop offset="100%" stop-color="rgba(8,8,15,0.96)"/>
      </radialGradient>
      <radialGradient id="r" cx="50%" cy="8%" r="60%">
        <stop offset="0%" stop-color="rgba(236,29,36,0.30)"/>
        <stop offset="100%" stop-color="rgba(236,29,36,0)"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect width="${W}" height="${H}" fill="url(#r)"/>
  </svg>`)
  const logo = await sharp(path.join(B, 'herorush-logo.webp')).resize({ width: 780 }).toBuffer()
  const logoMeta = await sharp(logo).metadata()
  const sh = await sharp(path.join(B, 'superhero-th.webp')).resize({ width: 210 }).toBuffer()
  const shMeta = await sharp(sh).metadata()

  const logoLeft = Math.round((W - 780) / 2)
  const logoTop = Math.round((H - logoMeta.height) / 2) - 34
  const shLeft = Math.round((W - 210) / 2)
  const shTop = H - shMeta.height - 46

  const outPath = path.join(__dirname, '..', 'public', 'og.jpg')
  await sharp(bg)
    .composite([
      { input: overlay, top: 0, left: 0 },
      { input: logo, top: logoTop, left: logoLeft },
      { input: sh, top: shTop, left: shLeft },
    ])
    .jpeg({ quality: 88 })
    .toFile(outPath)
  const out = await sharp(outPath).metadata()
  console.log('wrote public/og.jpg', out.width + 'x' + out.height, Math.round(fs.statSync(outPath).size / 1024) + 'KB')
})().catch((e) => { console.error(e); process.exit(1) })
