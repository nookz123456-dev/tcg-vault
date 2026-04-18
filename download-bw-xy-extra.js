/**
 * Download remaining BW + XY + LEGEND JP card images 
 * (Fixes: XY9, XY10, XY11 folders exist with different names,
 *  plus additional XY and LEGEND sets)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DOWNLOAD_DIR = path.join(__dirname, 'jp-bw-xy-images');
const GITHUB_TOKEN = fs.readFileSync('C:/Users/suwij/.openclaw/secrets/github', 'utf8').trim();

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const headers = { 'User-Agent': 'TCGVault/1.0' };
    if (url.includes('api.github.com')) headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    const req = client.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Invalid JSON from ${url}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
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

// Additional sets to download (missed in first run)
const ADDITIONAL_SETS = [
  'XY9-B', 'XY10-B', 'XY11-Bb', 'XY11-Br',
  'XY2', 'XY3', 'XY4', 'XY6', 'XY6-B', 'XY7', 'XY7-B',
  'XYA', 'XYB', 'XYC', 'XYD', 'XYE', 'XYF', 'XYG', 'XYH', 'XYP',
  'L1-Bhg', 'L1-Bss', 'L2-B', 'L2-Sb', 'L2-Sh', 'L3-B', 'LL',
];

// TCGdex set ID mapping
const FOLDER_TO_TCGDEX = {
  'BW1-Bb': 'BW1a', 'BW1-Bw': 'BW1b', 'BW2-B': 'BW2', 'BW3-Bh': 'BW3a', 'BW3-Bp': 'BW3b',
  'BW4-B': 'BW4', 'BW5-Brn': 'BW5a', 'BW5-Brz': 'BW5b', 'BW6-Bc': 'BW6a', 'BW6-Bf': 'BW6b',
  'BW7-B': 'BW7', 'BW8-Brf': 'BW8a', 'BW8-Brn': 'BW8b', 'BW9-B': 'BW9', 'BW10-B': 'BW10',
  'BWP': 'BWP', 'BW': 'BW',
  'XY1-Bx': 'XY1a', 'XY1-By': 'XY1b', 'XY2': 'XY2', 'XY3': 'XY3', 'XY4': 'XY4',
  'XY5-Bg': 'XY5a', 'XY5-Bt': 'XY5b', 'XY6': 'XY6', 'XY6-B': 'XY6b',
  'XY7': 'XY7', 'XY7-B': 'XY7b', 'XY8-Bb': 'XY8a', 'XY8-Br': 'XY8b',
  'XY9-B': 'XY9', 'XY10-B': 'XY10',
  'XY11-Bb': 'XY11a', 'XY11-Br': 'XY11b',
  'XY': 'XY', 'XYA': 'XYA', 'XYB': 'XYB', 'XYC': 'XYC', 'XYD': 'XYD',
  'XYE': 'XYE', 'XYF': 'XYF', 'XYG': 'XYG', 'XYH': 'XYH', 'XYP': 'XYP',
  'L1-Bhg': 'L1a', 'L1-Bss': 'L1b', 'L2-B': 'L2', 'L2-Sb': 'L2Sa', 'L2-Sh': 'L2Sb', 'L3-B': 'L3',
  'LL': 'LL',
};

async function main() {
  console.log('=== Download Additional BW + XY + LEGEND JP Card Images ===\n');
  
  if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  
  let totalDownloaded = 0;
  let totalFailed = 0;
  const cardMap = JSON.parse(fs.existsSync(path.join(__dirname, 'jp-bw-xy-card-map.json')) 
    ? fs.readFileSync(path.join(__dirname, 'jp-bw-xy-card-map.json'), 'utf8') 
    : '{}');
  
  for (const folder of ADDITIONAL_SETS) {
    console.log(`\n📦 Processing: ${folder}...`);
    
    let cardFiles;
    try {
      const listing = await fetchJSON(`https://api.github.com/repos/type-null/PTCG-database/contents/data_jp/${folder}`);
      if (!Array.isArray(listing)) {
        console.log(`  ⚠️ Not a folder: ${folder} - ${listing.message || 'unknown'}`);
        continue;
      }
      cardFiles = listing.filter(f => f.name.endsWith('.json'));
    } catch (e) {
      console.log(`  ❌ Error listing ${folder}: ${e.message}`);
      continue;
    }
    
    console.log(`  Found ${cardFiles.length} card files`);
    
    let downloaded = 0;
    let skipped = 0;
    
    for (let i = 0; i < cardFiles.length; i++) {
      const file = cardFiles[i];
      const cardId = file.name.replace('.json', '');
      
      try {
        const card = await fetchJSON(`https://raw.githubusercontent.com/type-null/PTCG-database/main/data_jp/${folder}/${file.name}`);
        
        if (!card.img) {
          totalFailed++;
          continue;
        }
        
        const tcgdexSetId = FOLDER_TO_TCGDEX[folder] || folder;
        const localId = card.localId || cardId;
        const key = `${tcgdexSetId}/${localId}`;
        
        cardMap[key] = {
          img: card.img,
          name: card.name || '',
          jp_id: card.id || cardId
        };
        
        // Download image (skip if exists)
        const imgFile = path.join(DOWNLOAD_DIR, folder, `${localId}.jpg`);
        if (fs.existsSync(imgFile)) {
          downloaded++;
          totalDownloaded++;
          continue;
        }
        
        try {
          await downloadImage(card.img, imgFile);
          downloaded++;
          totalDownloaded++;
        } catch (e) {
          if (totalFailed < 20) console.log(`  ❌ Download failed: ${cardId} - ${e.message}`);
          totalFailed++;
        }
        
        // Rate limit
        if (i % 5 === 0) await new Promise(r => setTimeout(r, 100));
        
      } catch (e) {
        totalFailed++;
      }
    }
    
    console.log(`  ✅ ${folder}: ${downloaded}/${cardFiles.length} images (skipped existing: ${downloaded - (cardFiles.length - totalFailed)})`);
  }
  
  console.log(`\n\n=== Summary ===`);
  console.log(`Total processed: ${totalDownloaded}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Card map entries: ${Object.keys(cardMap).length}`);
  
  // Save card map
  fs.writeFileSync(
    path.join(__dirname, 'jp-bw-xy-card-map.json'),
    JSON.stringify(cardMap, null, 2)
  );
  console.log('💾 Saved card map');
  
  // Count per set
  if (fs.existsSync(DOWNLOAD_DIR)) {
    let grandTotal = 0;
    console.log('\n📊 Files per set:');
    for (const dir of fs.readdirSync(DOWNLOAD_DIR).sort()) {
      const setDir = path.join(DOWNLOAD_DIR, dir);
      if (fs.statSync(setDir).isDirectory()) {
        const count = fs.readdirSync(setDir).length;
        grandTotal += count;
        console.log(`  ${dir}: ${count} images`);
      }
    }
    console.log(`  TOTAL: ${grandTotal} images`);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});