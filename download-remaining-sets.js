/**
 * Download LEGEND + remaining sets + resume XYP/Promo sets
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

const REMAINING_SETS = [
  'L1-Bss', 'L2-B', 'L2-Sb', 'L2-Sh', 'L3-B', 'LL',
  '20th', 'Bb', 'Bd', 'Bk', 'Br', 'BTV', 'CP1', 'CP2', 'CP3', 'CP4', 'CP5', 'CP6',
  'CS1m', 'CS1p', 'CS1t', 'DS', 'El', 'Em', 'GBR', 'KK', 'KLD', 'MA', 'MBD', 'MG',
  'MPS', 'PBG', 'PPD', 'PPP', 'PW', 'Ran', 'SA', 'SB', 'SC', 'SCS', 'SD',
  'SEF', 'SGG', 'SH', 'SI', 'SJ', 'SK', 'SLD', 'SLL', 'SN', 'SO',
  'SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'SP6', 'SPD', 'SPZ', 'WAK', 'WCP',
  'XY', 'XY1-Bx', 'XY1-By', 'XY10-B', 'XY11-Bb', 'XY11-Br', 'XY2', 'XY3', 'XY4',
  'XY5-Bg', 'XY5-Bt', 'XY6', 'XY6-B', 'XY7', 'XY7-B', 'XY8-Bb', 'XY8-Br', 'XY9-B',
  'XYA', 'XYB', 'XYC', 'XYD', 'XYE', 'XYF', 'XYG', 'XYH', 'XYP',
  'Y30',
];

const FOLDER_TO_TCGDEX = {
  'L1-Bhg': 'L1a', 'L1-Bss': 'L1b', 'L2-B': 'L2', 'L2-Sb': 'L2Sa', 'L2-Sh': 'L2Sb', 'L3-B': 'L3', 'LL': 'LL',
  'XY1-Bx': 'XY1a', 'XY1-By': 'XY1b', 'XY5-Bg': 'XY5a', 'XY5-Bt': 'XY5b',
  'XY8-Bb': 'XY8a', 'XY8-Br': 'XY8b', 'XY9-B': 'XY9', 'XY10-B': 'XY10',
  'XY11-Bb': 'XY11a', 'XY11-Br': 'XY11b',
  'XY': 'XY', 'XY2': 'XY2', 'XY3': 'XY3', 'XY4': 'XY4', 'XY6': 'XY6', 'XY6-B': 'XY6b',
  'XY7': 'XY7', 'XY7-B': 'XY7b',
  'XYA': 'XYA', 'XYB': 'XYB', 'XYC': 'XYC', 'XYD': 'XYD', 'XYE': 'XYE', 'XYF': 'XYF', 'XYG': 'XYG', 'XYH': 'XYH', 'XYP': 'XYP',
};

async function main() {
  console.log('=== Download Remaining Sets ===\n');
  
  if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  
  let totalDownloaded = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  
  for (const folder of REMAINING_SETS) {
    const setDir = path.join(DOWNLOAD_DIR, folder);
    
    // Check if we already have this set fully downloaded
    if (fs.existsSync(setDir)) {
      const existing = fs.readdirSync(setDir).length;
      if (existing > 50) { // Skip if we already have many files
        console.log(`  ⏭️ Skipping ${folder} (${existing} existing)`);
        totalSkipped += existing;
        continue;
      }
    }
    
    console.log(`\n📦 Processing: ${folder}...`);
    
    let cardFiles;
    try {
      const listing = await fetchJSON(`https://api.github.com/repos/type-null/PTCG-database/contents/data_jp/${folder}`);
      if (!Array.isArray(listing)) {
        console.log(`  ⚠️ Not a folder: ${folder}`);
        continue;
      }
      cardFiles = listing.filter(f => f.name.endsWith('.json'));
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
      continue;
    }
    
    console.log(`  Found ${cardFiles.length} card files`);
    
    let downloaded = 0;
    
    for (let i = 0; i < cardFiles.length; i++) {
      const file = cardFiles[i];
      const cardId = file.name.replace('.json', '');
      
      try {
        const card = await fetchJSON(`https://raw.githubusercontent.com/type-null/PTCG-database/main/data_jp/${folder}/${file.name}`);
        
        if (!card.img) {
          totalFailed++;
          continue;
        }
        
        const localId = card.localId || cardId;
        const imgFile = path.join(DOWNLOAD_DIR, folder, `${localId}.jpg`);
        
        if (fs.existsSync(imgFile)) {
          totalDownloaded++;
          continue;
        }
        
        try {
          await downloadImage(card.img, imgFile);
          downloaded++;
          totalDownloaded++;
        } catch (e) {
          if (totalFailed < 20) console.log(`  ❌ ${cardId}: ${e.message}`);
          totalFailed++;
        }
        
        if (i % 10 === 0) await new Promise(r => setTimeout(r, 100));
        
      } catch (e) {
        totalFailed++;
      }
    }
    
    console.log(`  ✅ ${folder}: ${downloaded} new images`);
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Downloaded/Skipped: ${totalDownloaded}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Skipped (existing): ${totalSkipped}`);
  
  // Final count
  let grandTotal = 0;
  if (fs.existsSync(DOWNLOAD_DIR)) {
    console.log('\n📊 All sets:');
    for (const dir of fs.readdirSync(DOWNLOAD_DIR).sort()) {
      const sd = path.join(DOWNLOAD_DIR, dir);
      if (fs.statSync(sd).isDirectory()) {
        const c = fs.readdirSync(sd).length;
        grandTotal += c;
      }
    }
    console.log(`TOTAL: ${grandTotal} images`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });