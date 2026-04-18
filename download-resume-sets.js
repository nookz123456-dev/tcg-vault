/**
 * Resume download from SD set onward + remaining promo sets
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
        if (res.statusCode !== 200) { res.resume(); reject(new Error(`HTTP ${res.statusCode}`)); return; }
        const stream = fs.createWriteStream(filepath);
        res.pipe(stream);
        stream.on('finish', () => { stream.close(); resolve(filepath); });
        stream.on('error', reject);
      }).on('error', reject);
    };
    followRedirect(url);
  });
}

// Remaining sets (after SD was interrupted)
const SETS = [
  'SD', 'SEF', 'SGG', 'SH', 'SI', 'SJ', 'SK', 'SLD', 'SLL', 'SN', 'SO',
  'SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'SP6', 'SPD', 'SPZ', 'WAK', 'WCP',
  'Y30', 'X30',
  'BGSv', 'BGSt', 'BKB', 'BKR', 'BKW', 'BKZ', 'BKc', 'BKt', 'BKv',
  'CLF', 'CLK', 'CLL', 'CPm', 'CPr', 'CPs', 'HSPm', 'HSPp', 'HSPt',
  'HSZm', 'HSZp', 'HSZt', 'HSm', 'HSp', 'HSt', 'HXY', 'LP', 'M-P',
  'M1L', 'M1S', 'MBG', 'MMB-P', 'MMB-S', 'MPS08', 'SNPo', 'SNPr', 'S-P', 'SV-P',
  'SV-P', 'WCS23', 'MMB-P',
];

async function main() {
  console.log('=== Resume Download Remaining Sets ===\n');
  
  let totalDownloaded = 0, totalFailed = 0;
  
  for (const folder of SETS) {
    const setDir = path.join(DOWNLOAD_DIR, folder);
    
    // Skip if already downloaded
    if (fs.existsSync(setDir) && fs.readdirSync(setDir).length > 20) {
      console.log(`  ⏭️ ${folder} already done`);
      continue;
    }
    
    console.log(`\n📦 ${folder}...`);
    
    let cardFiles;
    try {
      const listing = await fetchJSON(`https://api.github.com/repos/type-null/PTCG-database/contents/data_jp/${folder}`);
      if (!Array.isArray(listing)) { console.log(`  ⚠️ Not found`); continue; }
      cardFiles = listing.filter(f => f.name.endsWith('.json'));
    } catch (e) { console.log(`  ❌ ${e.message}`); continue; }
    
    console.log(`  ${cardFiles.length} cards`);
    let downloaded = 0;
    
    for (const file of cardFiles) {
      const cardId = file.name.replace('.json', '');
      try {
        const card = await fetchJSON(`https://raw.githubusercontent.com/type-null/PTCG-database/main/data_jp/${folder}/${file.name}`);
        if (!card.img) { totalFailed++; continue; }
        
        const localId = card.localId || cardId;
        const imgFile = path.join(DOWNLOAD_DIR, folder, `${localId}.jpg`);
        if (fs.existsSync(imgFile)) { totalDownloaded++; continue; }
        
        try {
          await downloadImage(card.img, imgFile);
          downloaded++;
          totalDownloaded++;
        } catch (e) { totalFailed++; }
        
        // Small delay to avoid overwhelming
        await new Promise(r => setTimeout(r, 50));
      } catch (e) { totalFailed++; }
    }
    console.log(`  ✅ ${downloaded} new`);
  }
  
  console.log(`\n=== Done: ${totalDownloaded} total, ${totalFailed} failed ===`);
  
  // Final count
  let grandTotal = 0;
  for (const dir of fs.readdirSync(DOWNLOAD_DIR).sort()) {
    const sd = path.join(DOWNLOAD_DIR, dir);
    if (fs.statSync(sd).isDirectory()) grandTotal += fs.readdirSync(sd).length;
  }
  console.log(`TOTAL images on disk: ${grandTotal}`);
}

main().catch(e => { console.error(e); process.exit(1); });