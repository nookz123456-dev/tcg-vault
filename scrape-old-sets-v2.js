/**
 * Alternative approach: Use TCGdex card data + pokemon-card.com pattern for remaining sets
 * + Try direct CDN URLs from artofpkm
 * 
 * The artofpkm card page showed: 035660_P_ENTEIGX.jpg
 * This matches pokemon-card.com's naming convention!
 * pokemon-card.com URL pattern: https://www.pokemon-card.com/card-search/details.php/card/{ID}/
 * 
 * Let's check if artofpkm just links to pokemon-card.com images for all sets
 * or if it hosts its own images for old sets
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DOWNLOAD_DIR = path.join(__dirname, 'jp-old-set-images');

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'TCGVault/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Invalid JSON from ${url}`)); }
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
          reject(new Error(`HTTP ${res.statusCode}`));
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

async function checkUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { method: 'HEAD', headers: { 'User-Agent': 'TCGVault/1.0' } }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', () => resolve(0));
    req.setTimeout(5000, () => { req.destroy(); resolve(0); });
  });
}

async function main() {
  console.log('=== Try pokemon-card.com for old sets ===\n');
  
  if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  
  // Old sets and their pokemon-card.com set IDs
  // pokemon-card.com uses numeric IDs for card pages
  // Pattern: https://www.pokemon-card.com/card-search/details.php/card/{numeric_id}/
  // Image pattern: https://www.pokemon-card.com/card-images/000{numeric_id}_P_{name}.jpg
  
  // First, let's check if artofpkm has card images for old sets
  // by trying to access a known PMCG card
  // artofpkm uses internal numeric IDs for cards
  // Let's try to find PMCG1 cards by searching
  
  // Actually, let's try a different approach:
  // The PTCG-database on GitHub has card data for ALL sets including old ones
  // with `img` field pointing to pokemon-card.com images
  
  // Let's check the data_jp folder for old sets
  console.log('Checking PTCG-database for old set data...\n');
  
  const OLD_SETS = [
    'PMCG1', 'PMCG2', 'PMCG3', 'PMCG4', 'PMCG5', 'PMCG6',
    'E1', 'E2', 'E3', 'E4', 'E5',
    'neo1', 'neo2', 'neo3', 'neo4',
    'ADV1', 'ADV2', 'ADV3', 'ADV4',
    'PCG1', 'PCG2', 'PCG3', 'PCG4', 'PCG5', 'PCG6', 'PCG7',
  ];
  
  let totalDownloaded = 0;
  let totalFailed = 0;
  
  for (const setId of OLD_SETS) {
    console.log(`\n📦 Processing set: ${setId}...`);
    
    // Get card list from TCGdex
    let setData;
    try {
      setData = await fetchJSON(`https://api.tcgdex.net/v2/ja/sets/${setId}`);
    } catch (e) {
      console.log(`  ❌ No TCGdex data for ${setId}`);
      continue;
    }
    
    if (!setData || !setData.cards) {
      console.log(`  ❌ No cards for ${setId}`);
      continue;
    }
    
    console.log(`  ✅ ${setData.cards.length} cards in set`);
    
    const setDir = path.join(DOWNLOAD_DIR, setId);
    if (!fs.existsSync(setDir)) fs.mkdirSync(setDir, { recursive: true });
    
    let downloaded = 0;
    
    for (const card of setData.cards) {
      const localId = card.localId || '';
      if (!localId) continue;
      
      // Try pokemon-card.com URL patterns for old sets
      // These cards don't have images on pokemon-card.com (we checked earlier)
      // But let's try artofpkm CDN pattern
      // artofpkm uses: https://www.artofpkm.com/rails/active_storage/representations/redirect/.../{card_code}.jpg
      // We don't know the card codes for old sets
      
      // Last resort: Try TCGdex assets URL with different prefix patterns
      const prefixes = [
        `ja/${setId}/${localId}`,
        `ja/PMCG/${setId.replace('PMCG','')}/${localId}`,  // PMCG prefix
        `ja/E/${setId.replace('E','')}/${localId}`,          // E prefix
        `ja/neo/${setId}/${localId}`,                          // neo prefix
        `ja/ADV/${setId.replace('ADV','')}/${localId}`,      // ADV prefix
        `ja/PCG/${setId.replace('PCG','')}/${localId}`,      // PCG prefix
      ];
      
      let found = false;
      for (const prefix of prefixes) {
        const url = `https://assets.tcgdex.net/${prefix}/high.webp`;
        try {
          const status = await checkUrl(url);
          if (status === 200) {
            const filepath = path.join(setDir, `${localId}.webp`);
            await downloadImage(url, filepath);
            downloaded++;
            found = true;
            break;
          }
        } catch (e) { /* try next */ }
      }
      
      if (!found) totalFailed++;
    }
    
    totalDownloaded += downloaded;
    console.log(`  📊 ${setId}: ${downloaded}/${setData.cards.length} images downloaded`);
  }
  
  console.log(`\n\n=== Summary ===`);
  console.log(`Downloaded: ${totalDownloaded}`);
  console.log(`Failed: ${totalFailed}`);
  
  // Count per set
  if (fs.existsSync(DOWNLOAD_DIR)) {
    console.log('\n📊 Files per set:');
    for (const dir of fs.readdirSync(DOWNLOAD_DIR).sort()) {
      const setDir = path.join(DOWNLOAD_DIR, dir);
      if (fs.statSync(setDir).isDirectory()) {
        const count = fs.readdirSync(setDir).length;
        console.log(`  ${dir}: ${count} files`);
      }
    }
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});