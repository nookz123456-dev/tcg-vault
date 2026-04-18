// Download the remaining large promo sets (S-P, SV-P, XYP, XY)
// These have hundreds of cards so we process them in smaller batches

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

const LARGE_SETS = ['S-P', 'SV-P', 'XYP', 'XY', 'BWP', 'SA', 'SD', 'SCS', 'MG', 'CS1m', 'CS1p', 'CS1t', 'WCS23'];

async function main() {
  console.log('=== Download Large Promo Sets ===\n');
  
  let totalDownloaded = 0, totalFailed = 0;
  
  for (const folder of LARGE_SETS) {
    const setDir = path.join(DOWNLOAD_DIR, folder);
    const existingCount = fs.existsSync(setDir) ? fs.readdirSync(setDir).length : 0;
    
    console.log(`\n📦 ${folder} (${existingCount} existing)...`);
    
    let cardFiles;
    try {
      const listing = await fetchJSON(`https://api.github.com/repos/type-null/PTCG-database/contents/data_jp/${folder}`);
      if (!Array.isArray(listing)) { console.log(`  ⚠️ Not found`); continue; }
      cardFiles = listing.filter(f => f.name.endsWith('.json'));
    } catch (e) { console.log(`  ❌ ${e.message}`); continue; }
    
    console.log(`  Total: ${cardFiles.length} cards, need: ${cardFiles.length - existingCount}`);
    
    let downloaded = 0;
    let batchCount = 0;
    
    for (const file of cardFiles) {
      const cardId = file.name.replace('.json', '');
      const imgFile = path.join(DOWNLOAD_DIR, folder, `${cardId}.jpg`);
      
      // Skip if already downloaded
      if (fs.existsSync(imgFile)) { totalDownloaded++; continue; }
      
      try {
        const card = await fetchJSON(`https://raw.githubusercontent.com/type-null/PTCG-database/main/data_jp/${folder}/${file.name}`);
        if (!card.img) { totalFailed++; continue; }
        
        await downloadImage(card.img, imgFile);
        downloaded++;
        totalDownloaded++;
      } catch (e) {
        totalFailed++;
      }
      
      batchCount++;
      if (batchCount % 50 === 0) {
        console.log(`  Progress: ${batchCount}/${cardFiles.length} (${downloaded} new)`);
        // Force garbage collection pause to prevent SIGKILL
        await new Promise(r => setTimeout(r, 200));
      }
    }
    
    console.log(`  ✅ ${downloaded} new images`);
  }
  
  console.log(`\n=== Done: ${totalDownloaded} total processed, ${totalFailed} failed ===`);
  
  let grandTotal = 0;
  for (const dir of fs.readdirSync(DOWNLOAD_DIR).sort()) {
    const sd = path.join(DOWNLOAD_DIR, dir);
    if (fs.statSync(sd).isDirectory()) grandTotal += fs.readdirSync(sd).length;
  }
  console.log(`TOTAL images on disk: ${grandTotal}`);
}

main().catch(e => { console.error(e); process.exit(1); });