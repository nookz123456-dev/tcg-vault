/**
 * Upload BW + XY + LEGEND JP card images to Supabase Storage
 * Uses batched upload with progress tracking
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://hezbxloxsgqwbondebjt.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlemJ4bG94c2dxd2JvbmRlYmp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI0MTYwNywiZXhwIjoyMDkxODE3NjA3fQ.xpulrdLMD209QeBgGpC8BLLLNyw5ftvrd9MmyqqKub0';
const BUCKET = 'jp-card-images';
const RESIZED_DIR = path.join(__dirname, 'jp-bw-xy-resized');

async function uploadFile(localPath, storagePath) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(localPath);
    const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`;
    
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'image/webp',
        'x-upsert': 'true',
        'Content-Length': fileData.length,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(true);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(fileData);
    req.end();
  });
}

async function main() {
  console.log('=== Upload BW+XY+LEGEND JP Card Images to Supabase ===\n');
  
  const uploadList = JSON.parse(fs.readFileSync(path.join(__dirname, 'jp-bw-xy-upload-list.json'), 'utf8'));
  console.log(`Total files to upload: ${uploadList.length}`);
  
  let uploaded = 0;
  let failed = 0;
  let skipped = 0;
  const startTime = Date.now();
  
  // Process in batches of 20
  const BATCH_SIZE = 20;
  
  for (let i = 0; i < uploadList.length; i += BATCH_SIZE) {
    const batch = uploadList.slice(i, i + BATCH_SIZE);
    
    const results = await Promise.allSettled(
      batch.map(async (item) => {
        if (!fs.existsSync(item.localPath)) {
          return { status: 'skip', path: item.storagePath };
        }
        try {
          await uploadFile(item.localPath, item.storagePath);
          return { status: 'ok', path: item.storagePath };
        } catch (e) {
          return { status: 'error', path: item.storagePath, error: e.message };
        }
      })
    );
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.status === 'ok') uploaded++;
        else if (result.value.status === 'skip') skipped++;
        else { failed++; if (failed <= 20) console.log(`  ❌ ${result.value.path}: ${result.value.error}`); }
      } else {
        failed++;
      }
    }
    
    // Progress
    if ((i + BATCH_SIZE) % 200 === 0 || i + BATCH_SIZE >= uploadList.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (uploaded / (elapsed / 60)).toFixed(0);
      console.log(`Progress: ${i + BATCH_SIZE}/${uploadList.length} (${uploaded} uploaded, ${failed} failed, ${skipped} skipped) [${rate}/min]`);
    }
    
    // Small delay between batches
    await new Promise(r => setTimeout(r, 100));
  }
  
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n=== Upload Complete ===`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Time: ${elapsed} minutes`);
}

main().catch(e => { console.error(e); process.exit(1); });