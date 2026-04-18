/**
 * Download BW + XY missing set card images from pokemon-card.com
 * Uses PTCG-database data_jp folder structure to find card JSONs with img URLs
 * Then downloads, resizes to webp, and we'll upload to Supabase later
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DOWNLOAD_DIR = path.join(__dirname, 'jp-bw-xy-images');
const RESIZED_DIR = path.join(__dirname, 'jp-bw-xy-resized');
const SUPABASE_URL = 'https://hezbxloxsgqwbondebjt.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlemJ4bG94c2dxd2JvbmRlYmp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDUxMTI0NSwiZXhwIjoyMDYwMDg3MjQ1fQ.H3bQ0qL3c5vKq1qL3c5vKq1qL3c5vKq1qL3c5vKq1qL3c5v';

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

// BW + XY sets in PTCG-database data_jp folder format
const SET_FOLDERS = [
  // BW era
  'BW1-Bb', 'BW1-Bw', 'BW2-B', 'BW3-Bh', 'BW3-Bp', 'BW4-B',
  'BW5-Brn', 'BW5-Brz', 'BW6-Bc', 'BW6-Bf', 'BW7-B', 'BW8-Brf',
  'BW8-Brn', 'BW9-B', 'BW10-B', 'BW', 'BWP',
  // XY era (missing ones from our current coverage)
  'XY1-Bx', 'XY1-By', 'XY5-Bg', 'XY5-Bt', 'XY8-Bb', 'XY8-Br', 'XY9-B', 'XY10-B',
  'XY11-Bb', 'XY11-Br', 'XY',
  // LEGEND era
  'L1-Bhg', 'L1-Bss', 'L2-B', 'L2-Sb', 'L2-Sh', 'L3-B',
];

// TCGdex set ID mapping (PTCG-database folder → TCGdex set ID)
const FOLDER_TO_TCGDEX = {
  'BW1-Bb': 'BW1a', 'BW1-Bw': 'BW1b', 'BW2-B': 'BW2', 'BW3-Bh': 'BW3a', 'BW3-Bp': 'BW3b',
  'BW4-B': 'BW4', 'BW5-Brn': 'BW5a', 'BW5-Brz': 'BW5b', 'BW6-Bc': 'BW6a', 'BW6-Bf': 'BW6b',
  'BW7-B': 'BW7', 'BW8-Brf': 'BW8a', 'BW8-Brn': 'BW8b', 'BW9-B': 'BW9', 'BW10-B': 'BW10',
  'XY1-Bx': 'XY1a', 'XY1-By': 'XY1b', 'XY5-Bg': 'XY5a', 'XY5-Bt': 'XY5b',
  'XY8-Bb': 'XY8a', 'XY8-Br': 'XY8b', 'XY9-B': 'XY9', 'XY10-B': 'XY10',
  'XY11-Bb': 'XY11a', 'XY11-Br': 'XY11b',
  'L1-Bhg': 'L1a', 'L1-Bss': 'L1b', 'L2-B': 'L2', 'L3-B': 'L3',
};

async function main() {
  console.log('=== Download BW + XY + LEGEND JP Card Images ===\n');
  
  if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  if (!fs.existsSync(RESIZED_DIR)) fs.mkdirSync(RESIZED_DIR, { recursive: true });
  
  let totalDownloaded = 0;
  let totalFailed = 0;
  const cardMap = {}; // setId/localId -> { img, name, jp_id }
  
  for (const folder of SET_FOLDERS) {
    console.log(`\n📦 Processing: ${folder}...`);
    
    // Get card JSONs from PTCG-database
    let cardFiles;
    try {
      const listing = await fetchJSON(`https://api.github.com/repos/type-null/PTCG-database/contents/data_jp/${folder}`);
      if (!Array.isArray(listing)) {
        console.log(`  ⚠️ Not a folder or empty: ${folder}`);
        continue;
      }
      cardFiles = listing.filter(f => f.name.endsWith('.json'));
    } catch (e) {
      console.log(`  ❌ Error listing ${folder}: ${e.message}`);
      continue;
    }
    
    console.log(`  Found ${cardFiles.length} card files`);
    
    let downloaded = 0;
    
    for (let i = 0; i < cardFiles.length; i++) {
      const file = cardFiles[i];
      const cardId = file.name.replace('.json', '');
      
      try {
        // Get card data from PTCG-database
        const card = await fetchJSON(`https://raw.githubusercontent.com/type-null/PTCG-database/main/data_jp/${folder}/${file.name}`);
        
        if (!card.img) {
          if (totalFailed < 20) console.log(`  ⚠️ No img for ${cardId}: ${card.name || 'unknown'}`);
          totalFailed++;
          continue;
        }
        
        // Extract TCGdex set ID and local ID
        const tcgdexSetId = FOLDER_TO_TCGDEX[folder] || folder;
        const localId = card.localId || cardId;
        const key = `${tcgdexSetId}/${localId}`;
        
        cardMap[key] = {
          img: card.img,
          name: card.name || '',
          jp_id: card.id || cardId
        };
        
        // Download image
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
          if (totalFailed < 30) console.log(`  ❌ Download failed: ${cardId} - ${e.message}`);
          totalFailed++;
        }
        
        // Rate limit
        if (i % 5 === 0) await new Promise(r => setTimeout(r, 100));
        
      } catch (e) {
        totalFailed++;
      }
    }
    
    console.log(`  ✅ ${folder}: ${downloaded}/${cardFiles.length} images`);
  }
  
  console.log(`\n\n=== Summary ===`);
  console.log(`Downloaded: ${totalDownloaded}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Card map entries: ${Object.keys(cardMap).length}`);
  
  // Save card map
  fs.writeFileSync(
    path.join(__dirname, 'jp-bw-xy-card-map.json'),
    JSON.stringify(cardMap, null, 2)
  );
  console.log('💾 Saved card map to jp-bw-xy-card-map.json');
  
  // Count per set
  if (fs.existsSync(DOWNLOAD_DIR)) {
    console.log('\n📊 Files per set:');
    for (const dir of fs.readdirSync(DOWNLOAD_DIR).sort()) {
      const setDir = path.join(DOWNLOAD_DIR, dir);
      if (fs.statSync(setDir).isDirectory()) {
        const count = fs.readdirSync(setDir).length;
        console.log(`  ${dir}: ${count} images`);
      }
    }
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});