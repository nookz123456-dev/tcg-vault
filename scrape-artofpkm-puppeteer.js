/**
 * Scrape old JP set card images from artofpkm.com
 * Uses Puppeteer for JS-rendered pages
 * 
 * Strategy:
 * 1. Use TCGdex API to get card IDs for each old set
 * 2. For each set, fetch the artofpkm.com set page with Puppeteer
 * 3. Extract image URLs from the rendered page
 * 4. Download images
 */

const puppeteer = require('puppeteer');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DOWNLOAD_DIR = path.join(__dirname, 'jp-old-set-images');

// Mapping from TCGdex set IDs to artofpkm.com set IDs (numeric)
// We'll discover these by scraping
const ARTYOF_PKM_SET_MAP = {};

async function main() {
  console.log('=== Scrape Old JP Sets from artofpkm.com ===\n');
  
  if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Step 1: Get the sets page to discover set IDs
    console.log('📋 Fetching sets page from artofpkm.com...');
    const page = await browser.newPage();
    await page.goto('https://www.artofpkm.com/sets', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Extract set links and names
    const sets = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/sets/"]');
      const result = [];
      for (const link of links) {
        const href = link.getAttribute('href');
        const name = link.textContent.trim();
        if (href && href.match(/\/sets\/\d+$/)) {
          result.push({
            id: href.match(/\/sets\/(\d+)/)?.[1],
            name: name,
            url: `https://www.artofpkm.com${href}`
          });
        }
      }
      return result;
    });
    
    console.log(`Found ${sets.length} sets on artofpkm.com`);
    
    // Save sets data
    fs.writeFileSync(path.join(__dirname, 'artofpkm-sets.json'), JSON.stringify(sets, null, 2));
    
    // Filter for old sets we need (PMCG, E, neo, ADV, PCG, LEGEND, Base, BW)
    // We'll match by era - artofpkm organizes sets by era
    const eraNames = ['PMCG', 'e-Card', 'VS & Web', 'Neo', 'ADV', 'PCG', 'LEGEND', 'Black & White'];
    
    // Step 2: For each old set, get card images
    let totalDownloaded = 0;
    let totalFailed = 0;
    
    // Focus on the old sets first
    const oldSetPatterns = [
      /第1弾|拡張パック|ジャングル|化石|ロケット|リーダ|闇から/i, // PMCG
      /基本拡張|地図|海から|裂けた|神秘/i, // E-Card
      /金.*銀|遺跡|めざめる|闇.*光/i, // neo
      /砂漠|天空|強化|とかれた/i, // ADV
      /伝説|蒼空|逆襲|金の空|まぼろし|ホロン|結晶|さいはて|チャンピオン/i, // PCG
      /LEGEND/i,
      /ブラック|ホワイト|レッド|ブルー/i, // BW
    ];
    
    // Just try to scrape the first few old sets
    const targetSets = sets.filter(s => {
      const name = s.name.toLowerCase();
      return s.name && (
        s.name.includes('拡張パック') ||
        s.name.includes('ジャングル') ||
        s.name.includes('化石') ||
        s.name.includes('ロケット') ||
        s.name.includes('闇') ||
        s.name.includes('基本') ||
        s.name.includes('地図') ||
        s.name.includes('金、銀') ||
        s.name.includes('伝説') ||
        s.name.includes('蒼空') ||
        s.name.includes('Base') ||
        s.name.includes('Neo') ||
        s.name.includes('ADV') ||
        s.name.includes('PCG') ||
        s.name.includes('BW') ||
        s.name.includes('LEGEND')
      );
    });
    
    console.log(`\n🎯 Found ${targetSets.length} matching old sets`);
    targetSets.slice(0, 5).forEach(s => console.log(`  ${s.id}: ${s.name}`));
    
    // Step 3: Visit each target set's card page and extract images
    for (const set of targetSets.slice(0, 3)) {
      console.log(`\n📦 Scraping set ${set.id}: ${set.name}...`);
      try {
        await page.goto(`${set.url}/cards`, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('img[src*="active_storage"], img[src*="cdn"]', { timeout: 10000 }).catch(() => {});
        
        const cards = await page.evaluate(() => {
          const imgs = document.querySelectorAll('img[src*="active_storage"], img[src*="cdn"]');
          return Array.from(imgs).map(img => ({
            src: img.src,
            alt: img.alt || ''
          }));
        });
        
        console.log(`  Found ${cards.length} card images`);
        cards.slice(0, 3).forEach(c => console.log(`  ${c.alt}: ${c.src.substring(0, 80)}...`));
      } catch (e) {
        console.log(`  ❌ Error: ${e.message}`);
      }
    }
    
  } finally {
    await browser.close();
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});