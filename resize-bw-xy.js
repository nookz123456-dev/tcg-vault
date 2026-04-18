/**
 * Resize all downloaded JP card images to webp (400px wide, 80% quality)
 * Build card mapping from PTCG-database card JSONs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOWNLOAD_DIR = path.join(__dirname, 'jp-bw-xy-images');
const RESIZED_DIR = path.join(__dirname, 'jp-bw-xy-resized');
const GITHUB_TOKEN = fs.readFileSync('C:/Users/suwij/.openclaw/secrets/github', 'utf8').trim();

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('sharp not available, will use ffmpeg for resize');
  sharp = null;
}

async function main() {
  console.log('=== Resize JP Card Images to WebP ===\n');
  
  if (!fs.existsSync(RESIZED_DIR)) fs.mkdirSync(RESIZED_DIR, { recursive: true });
  
  // Get all set folders
  const setFolders = fs.readdirSync(DOWNLOAD_DIR).filter(f => {
    return fs.statSync(path.join(DOWNLOAD_DIR, f)).isDirectory();
  });
  
  console.log(`Found ${setFolders.length} set folders\n`);
  
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  
  for (const folder of setFolders) {
    const srcDir = path.join(DOWNLOAD_DIR, folder);
    const dstDir = path.join(RESIZED_DIR, folder);
    if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
    
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    let setProcessed = 0;
    
    for (const file of files) {
      const srcPath = path.join(srcDir, file);
      const dstPath = path.join(dstDir, file.replace(/\.(jpg|png)$/, '.webp'));
      
      // Skip if already resized
      if (fs.existsSync(dstPath)) {
        totalSkipped++;
        continue;
      }
      
      try {
        if (sharp) {
          await sharp(srcPath)
            .resize(400, null, { withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(dstPath);
        } else {
          // Use ffmpeg fallback
          execSync(`ffmpeg -y -i "${srcPath}" -vf "scale='min(400,iw)':-1" -q:v 75 "${dstPath}"`, 
            { stdio: 'pipe' });
        }
        setProcessed++;
        totalProcessed++;
      } catch (e) {
        totalFailed++;
        if (totalFailed <= 10) console.log(`  ❌ ${folder}/${file}: ${e.message}`);
      }
    }
    
    if (setProcessed > 0) console.log(`  ${folder}: ${setProcessed} resized`);
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Resized: ${totalProcessed}`);
  console.log(`Skipped (existing): ${totalSkipped}`);
  console.log(`Failed: ${totalFailed}`);
  
  // Count total resized files
  let totalFiles = 0;
  let totalSize = 0;
  for (const folder of fs.readdirSync(RESIZED_DIR)) {
    const dir = path.join(RESIZED_DIR, folder);
    if (fs.statSync(dir).isDirectory()) {
      for (const file of fs.readdirSync(dir)) {
        if (file.endsWith('.webp')) {
          totalFiles++;
          totalSize += fs.statSync(path.join(dir, file)).size;
        }
      }
    }
  }
  console.log(`\nTotal webp files: ${totalFiles}`);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
}

main().catch(e => { console.error(e); process.exit(1); });