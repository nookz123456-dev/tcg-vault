/**
 * Scrape old JP set card images from artofpkm.com
 * Covers: PMCG, E-Card, neo, ADV, PCG, LEGEND, Base, BW, XY missing sets
 * 
 * Strategy: 
 * 1. Get set list from artofpkm.com/sets page (JS-rendered)
 * 2. For each set, get card list with image URLs
 * 3. Download images, resize to webp, upload to Supabase
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Sets we need that aren't in our current Supabase CDN
const MISSING_SETS = {
  // PMCG era
  'PMCG1': 'pmcg1', 'PMCG2': 'pmcg2', 'PMCG3': 'pmcg3', 
  'PMCG4': 'pmcg4', 'PMCG5': 'pmcg5', 'PMCG6': 'pmcg6',
  // E-Card era
  'E1': 'e1', 'E2': 'e2', 'E3': 'e3', 'E4': 'e4', 'E5': 'e5',
  // neo era
  'neo1': 'neo1', 'neo2': 'neo2', 'neo3': 'neo3', 'neo4': 'neo4',
  // ADV era
  'ADV1': 'adv1', 'ADV2': 'adv2', 'ADV3': 'adv3', 'ADV4': 'adv4',
  // PCG era
  'PCG1': 'pcg1', 'PCG2': 'pcg2', 'PCG3': 'pcg3', 'PCG4': 'pcg4',
  'PCG5': 'pcg5', 'PCG6': 'pcg6', 'PCG7': 'pcg7',
  // LEGEND
  'LEGEND': 'legend',
  // Base
  'base': 'base1',
  // BW era
  'BW1': 'bw1', 'BW2': 'bw2', 'BW3': 'bw3', 'BW4': 'bw4', 'BW5': 'bw5', 'BW6': 'bw6',
  // Missing XY sets
  'XY1': 'xy1', 'XY5': 'xy5', 'XY8': 'xy8', 'XY9': 'xy9', 'XY10': 'xy10',
};

// TCGdex set IDs for these old sets (used to match cards)
const TCGDEX_SET_IDS = Object.keys(MISSING_SETS);

const SUPABASE_URL = 'https://hezbxloxsgqwbondebjt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Y4STzv-8E-iXcivRYswjgQ_H1rFRXdI';

const DOWNLOAD_DIR = path.join(__dirname, 'jp-old-set-images');
const RESIZED_DIR = path.join(__dirname, 'jp-old-set-resized');

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'TCGVault/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Invalid JSON from ${url}: ${data.substring(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'TCGVault/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Get set cards from TCGdex (has set listings even for old sets)
async function getTCGdexSetCards(setId) {
  try {
    const data = await fetchJSON(`https://api.tcgdex.net/v2/ja/${setId}`);
    return data;
  } catch (e) {
    return null;
  }
}

// Try to find artofpkm set ID by searching
async function findArtofpkmSetId(setName) {
  // artofpkm uses numeric IDs for sets
  // We'll need to scrape the sets page to map names to IDs
  return null;
}

// Download image from URL
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const client = url.startsWith('https') ? https : http;
    
    const request = (reqUrl) => {
      client.get(reqUrl, { headers: { 'User-Agent': 'TCGVault/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          request(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const stream = fs.createWriteStream(filepath);
        res.pipe(stream);
        stream.on('finish', () => {
          stream.close();
          resolve(filepath);
        });
        stream.on('error', reject);
      }).on('error', reject);
    };
    
    request(url);
  });
}

async function main() {
  console.log('=== Scrape Old JP Set Images from TCGdex + artofpkm ===\n');
  
  // Create directories
  if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  if (!fs.existsSync(RESIZED_DIR)) fs.mkdirSync(RESIZED_DIR, { recursive: true });
  
  // Step 1: Get card data from TCGdex for each missing set
  let totalCards = 0;
  let totalDownloaded = 0;
  let totalFailed = 0;
  const cardMap = {}; // setId/localId -> { imageUrl, name }
  
  for (const setId of TCGDEX_SET_IDS) {
    console.log(`\nFetching set: ${setId}...`);
    const setData = await getTCGdexSetCards(setId);
    
    if (!setData || !setData.cards) {
      console.log(`  ⚠️ No data for ${setId}, trying alternate IDs...`);
      // Try lowercase
      const altData = await getTCGdexSetCards(setId.toLowerCase());
      if (!altData || !altData.cards) {
        console.log(`  ❌ Skipped ${setId} - no TCGdex data`);
        continue;
      }
      processSetData(setId, altData, cardMap);
    } else {
      processSetData(setId, setData, cardMap);
    }
  }
  
  function processSetData(setId, data, map) {
    if (!data.cards) return;
    let count = 0;
    for (const card of data.cards) {
      if (card.image) {
        const localId = card.localId || '';
        const key = `${setId}/${localId}`;
        map[key] = {
          imageUrl: `${card.image}/high.webp`,
          name: card.name || '',
          tcgdexId: card.id || ''
        };
        count++;
      }
    }
    totalCards += count;
    console.log(`  ✅ ${setId}: ${count} cards with images`);
  }
  
  console.log(`\n📊 Total cards with TCGdex images: ${totalCards}`);
  console.log(`📊 Card map size: ${Object.keys(cardMap).length}`);
  
  // Save card map for reference
  fs.writeFileSync(
    path.join(__dirname, 'jp-old-set-cards.json'),
    JSON.stringify(cardMap, null, 2)
  );
  console.log('💾 Saved card map to jp-old-set-cards.json');
  
  // Step 2: Download images
  console.log('\n📥 Downloading images...');
  const entries = Object.entries(cardMap);
  
  for (let i = 0; i < entries.length; i++) {
    const [key, card] = entries[i];
    const [setId, localId] = key.split('/');
    const filename = `${localId}.webp`;
    const filepath = path.join(DOWNLOAD_DIR, setId, filename);
    
    // Skip if already downloaded
    if (fs.existsSync(filepath)) {
      totalDownloaded++;
      continue;
    }
    
    try {
      await downloadImage(card.imageUrl, filepath);
      totalDownloaded++;
      if ((i + 1) % 100 === 0) {
        console.log(`  Progress: ${i + 1}/${entries.length} downloaded, ${totalDownloaded} ok, ${totalFailed} failed`);
      }
    } catch (e) {
      totalFailed++;
      if (totalFailed <= 20) {
        console.log(`  ❌ Failed: ${key} - ${e.message}`);
      }
    }
    
    // Rate limit
    if (i % 5 === 0) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  
  console.log(`\n📊 Download complete: ${totalDownloaded} ok, ${totalFailed} failed out of ${entries.length}`);
  
  // Step 3: Count downloaded files per set
  const setCounts = {};
  if (fs.existsSync(DOWNLOAD_DIR)) {
    for (const dir of fs.readdirSync(DOWNLOAD_DIR)) {
      const setDir = path.join(DOWNLOAD_DIR, dir);
      if (fs.statSync(setDir).isDirectory()) {
        setCounts[dir] = fs.readdirSync(setDir).filter(f => f.endsWith('.webp')).length;
      }
    }
  }
  
  console.log('\n📊 Files per set:');
  for (const [setId, count] of Object.entries(setCounts).sort()) {
    console.log(`  ${setId}: ${count} images`);
  }
  console.log(`  Total: ${Object.values(setCounts).reduce((a, b) => a + b, 0)} images`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});