/**
 * Scrape old JP set card images from artofpkm.com
 * Strategy: Fetch each card detail page, extract Active Storage image URL
 * artofpkm uses numeric card IDs, we'll get them from TCGdex set data
 * Then download images, resize to webp, and we'll upload to Supabase later
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DOWNLOAD_DIR = path.join(__dirname, 'jp-old-set-images');

// TCGdex has set listings for old sets (just no images)
// We'll get the card list from TCGdex, then find corresponding artofpkm images

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'TCGVault/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Invalid JSON from ${url}: ${data.substring(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const followRedirect = (reqUrl, retries = 5) => {
      const client = reqUrl.startsWith('https') ? https : http;
      client.get(reqUrl, { headers: { 'User-Agent': 'TCGVault/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (retries <= 0) { reject(new Error('Too many redirects')); return; }
          followRedirect(res.headers.location, retries - 1);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode} for ${reqUrl}`));
          return;
        }
        const stream = fs.createWriteStream(filepath);
        res.pipe(stream);
        stream.on('finish', () => { stream.close(); resolve(filepath); });
        stream.on('error', reject);
      }).on('error', reject);
    };
    
    followRedirect(url);
  });
}

async function main() {
  console.log('=== Scrape Old JP Set Card Images ===\n');
  
  // Old sets that need images (not covered by pokemon-card.com)
  const OLD_SETS = [
    'PMCG1', 'PMCG2', 'PMCG3', 'PMCG4', 'PMCG5', 'PMCG6',
    'E1', 'E2', 'E3', 'E4', 'E5',
    'neo1', 'neo2', 'neo3', 'neo4',
    'ADV1', 'ADV2', 'ADV3', 'ADV4',
    'PCG1', 'PCG2', 'PCG3', 'PCG4', 'PCG5', 'PCG6', 'PCG7',
    'base1', 'BW1', 'BW2', 'BW3', 'BW4', 'BW5', 'BW6',
    'XY1', 'XY5', 'XY8', 'XY9', 'XY10',
  ];
  
  // Also try alternate IDs
  const ALT_IDS = {
    'base1': 'base',
    'XY1': 'XY1a',
    'XY5': 'XY5a',
    'ADV4': 'ADV4ex',
  };
  
  if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  
  let totalCards = 0;
  let totalDownloaded = 0;
  let totalFailed = 0;
  const allCards = {};
  
  for (const setId of OLD_SETS) {
    console.log(`\n📦 Fetching set: ${setId}...`);
    
    // Get card list from TCGdex
    let setData = null;
    for (const tryId of [setId, ALT_IDS[setId], setId.toLowerCase()].filter(Boolean)) {
      try {
        setData = await fetchJSON(`https://api.tcgdex.net/v2/ja/sets/${tryId}`);
        if (setData && setData.cards) break;
      } catch (e) { /* try next */ }
    }
    
    if (!setData || !setData.cards) {
      console.log(`  ❌ No TCGdex data for ${setId}`);
      continue;
    }
    
    console.log(`  ✅ ${setId}: ${setData.cards.length} cards (${setData.name})`);
    
    // For each card, try to download image from TCGdex assets
    // Even though the API returns null for card.image, the asset URL pattern might still work
    const setDir = path.join(DOWNLOAD_DIR, setId);
    if (!fs.existsSync(setDir)) fs.mkdirSync(setDir, { recursive: true });
    
    let setDownloaded = 0;
    
    for (const card of setData.cards) {
      const localId = card.localId || card.id?.split('-')[1] || '';
      if (!localId) continue;
      
      // Try TCGdex asset URL pattern
      const assetUrls = [
        `https://assets.tcgdex.net/ja/${setId}/${localId}/high.webp`,
        `https://assets.tcgdex.net/ja/${setId}/${localId}/high.png`,
      ];
      
      let downloaded = false;
      for (const url of assetUrls) {
        try {
          const filepath = path.join(setDir, `${localId}.webp`);
          if (fs.existsSync(filepath)) {
            downloaded = true;
            break;
          }
          
          const res = await new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            const req = client.get(url, { headers: { 'User-Agent': 'TCGVault/1.0' } }, resolve);
            req.on('error', reject);
            req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
          });
          
          if (res.statusCode === 200) {
            // Download it
            const stream = fs.createWriteStream(filepath);
            await new Promise((resolve, reject) => {
              res.pipe(stream);
              stream.on('finish', resolve);
              stream.on('error', reject);
            });
            downloaded = true;
            break;
          } else {
            res.resume();
          }
        } catch (e) {
          // Try next URL
        }
      }
      
      if (downloaded) {
        setDownloaded++;
        totalDownloaded++;
      } else {
        totalFailed++;
      }
      totalCards++;
    }
    
    console.log(`  📊 ${setId}: ${setDownloaded}/${setData.cards.length} images downloaded`);
  }
  
  console.log(`\n\n=== Summary ===`);
  console.log(`Total cards processed: ${totalCards}`);
  console.log(`Successfully downloaded: ${totalDownloaded}`);
  console.log(`Failed: ${totalFailed}`);
  
  // Count per set
  if (fs.existsSync(DOWNLOAD_DIR)) {
    console.log('\n📊 Files per set:');
    for (const dir of fs.readdirSync(DOWNLOAD_DIR).sort()) {
      const setDir = path.join(DOWNLOAD_DIR, dir);
      if (fs.statSync(setDir).isDirectory()) {
        const count = fs.readdirSync(setDir).filter(f => f.endsWith('.webp')).length;
        console.log(`  ${dir}: ${count} images`);
      }
    }
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});