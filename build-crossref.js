/**
 * Build cross-reference between PTCG-database card IDs and TCGdex localIds
 * This is needed because:
 * - Supabase CDN stores files as {tcgdexSetId}/{ptcgdbNumericId}.webp
 * - TCGdex API uses localId like "001", "017"
 * - We need to map TCGdex localId → PTCG-database numeric ID for each card
 * 
 * For SV/S/SM/XY/DP sets (already in jp-card-images.json), the mapping uses 
 * zero-padded localId (e.g., "017") and that's what's stored on Supabase.
 * 
 * For BW/XY/LEGEND/Promo sets (just added), we need to build the mapping 
 * from TCGdex card data.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = fs.readFileSync('C:/Users/suwij/.openclaw/secrets/github', 'utf8').trim();

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const headers = { 'User-Agent': 'TCGVault/1.0' };
    if (url.includes('api.github.com')) headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    const req = https.get(url, { headers }, (res) => {
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

// TCGdex set IDs for BW/XY/LEGEND that we need mappings for
const TCGDEX_SET_IDS = [
  'BW1a','BW1b','BW2','BW3a','BW3b','BW4','BW5a','BW5b','BW6a','BW6b',
  'BW7','BW8a','BW8b','BW9','BW10','BWP',
  'XY1a','XY1b','XY2','XY3','XY4','XY5a','XY5b','XY6','XY6b',
  'XY7','XY7b','XY8a','XY8b','XY9','XY10','XY11a','XY11b',
  'XYA','XYB','XYC','XYD','XYE','XYF','XYG','XYH','XYP',
  'L1a','L1b','L2','L2Sa','L2Sb','L3',
];

// PTCG-database folder → TCGdex set ID mapping
const FOLDER_TO_TCGDEX = {
  'BW1-Bb': 'BW1a', 'BW1-Bw': 'BW1b', 'BW2-B': 'BW2', 'BW3-Bh': 'BW3a', 'BW3-Bp': 'BW3b',
  'BW4-B': 'BW4', 'BW5-Brn': 'BW5a', 'BW5-Brz': 'BW5b', 'BW6-Bc': 'BW6a', 'BW6-Bf': 'BW6b',
  'BW7-B': 'BW7', 'BW8-Brf': 'BW8a', 'BW8-Brn': 'BW8b', 'BW9-B': 'BW9', 'BW10-B': 'BW10',
  'XY1-Bx': 'XY1a', 'XY1-By': 'XY1b', 'XY2': 'XY2', 'XY3': 'XY3', 'XY4': 'XY4',
  'XY5-Bg': 'XY5a', 'XY5-Bt': 'XY5b', 'XY6': 'XY6', 'XY6-B': 'XY6b',
  'XY7': 'XY7', 'XY7-B': 'XY7b', 'XY8-Bb': 'XY8a', 'XY8-Br': 'XY8b',
  'XY9-B': 'XY9', 'XY10-B': 'XY10', 'XY11-Bb': 'XY11a', 'XY11-Br': 'XY11b',
  'L1-Bhg': 'L1a', 'L1-Bss': 'L1b', 'L2-B': 'L2', 'L2-Sb': 'L2Sa', 'L2-Sh': 'L2Sb', 'L3-B': 'L3',
};

async function main() {
  console.log('=== Build PTCG-database ↔ TCGdex Cross-Reference ===\n');
  
  // For each set, get TCGdex card list and PTCG-database card list
  // Match cards by name to create: TCGdex localId → PTCG-database file ID
  
  const crossRef = {}; // { tcgdexSetId: { localId: ptcgdbFileId } }
  
  for (const tcgdexSetId of TCGDEX_SET_IDS) {
    console.log(`Processing ${tcgdexSetId}...`);
    
    // Get TCGdex cards for this set
    let tcgdexCards;
    try {
      const setData = await fetchJSON(`https://api.tcgdex.net/v2/ja/sets/${tcgdexSetId}`);
      if (!setData || !setData.cards) {
        console.log(`  ⚠️ No TCGdex data for ${tcgdexSetId}`);
        continue;
      }
      tcgdexCards = setData.cards;
    } catch (e) {
      console.log(`  ❌ Error fetching ${tcgdexSetId}: ${e.message}`);
      continue;
    }
    
    // Find the PTCG-database folder for this set
    const ptcgdbFolder = Object.entries(FOLDER_TO_TCGDEX).find(([_, v]) => v === tcgdexSetId)?.[0];
    if (!ptcgdbFolder) {
      console.log(`  ⚠️ No PTCG-database folder for ${tcgdexSetId}`);
      continue;
    }
    
    // Get PTCG-database card files
    let ptcgdbFiles;
    try {
      const listing = await fetchJSON(`https://api.github.com/repos/type-null/PTCG-database/contents/data_jp/${ptcgdbFolder}`);
      if (!Array.isArray(listing)) {
        console.log(`  ⚠️ No PTCG-database listing for ${ptcgdbFolder}`);
        continue;
      }
      ptcgdbFiles = listing.filter(f => f.name.endsWith('.json'));
    } catch (e) {
      console.log(`  ❌ Error fetching PTCG-database ${ptcgdbFolder}: ${e.message}`);
      continue;
    }
    
    console.log(`  TCGdex: ${tcgdexCards.length} cards, PTCG-database: ${ptcgdbFiles.length} cards`);
    
    // Build PTCG-database name → file ID map
    const ptcgdbByName = {};
    for (const file of ptcgdbFiles) {
      try {
        const card = await fetchJSON(`https://raw.githubusercontent.com/type-null/PTCG-database/main/data_jp/${ptcgdbFolder}/${file.name}`);
        const fileId = file.name.replace('.json', '');
        if (card.name) {
          ptcgdbByName[card.name] = fileId;
        }
      } catch (e) { /* skip */ }
    }
    
    // Match TCGdex cards to PTCG-database by name
    const setRef = {};
    let matched = 0;
    for (const card of tcgdexCards) {
      const localId = card.localId;
      if (!localId) continue;
      
      // Try exact name match
      if (ptcgdbByName[card.name]) {
        setRef[localId] = ptcgdbByName[card.name];
        matched++;
      }
    }
    
    crossRef[tcgdexSetId] = setRef;
    console.log(`  ✅ Matched ${matched}/${tcgdexCards.length} cards`);
    
    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Save cross-reference
  fs.writeFileSync(
    path.join(__dirname, 'jp-bw-xy-crossref.json'),
    JSON.stringify(crossRef, null, 2)
  );
  console.log(`\n💾 Saved cross-reference to jp-bw-xy-crossref.json`);
  
  // Stats
  let totalRefs = 0;
  for (const [setId, refs] of Object.entries(crossRef)) {
    totalRefs += Object.keys(refs).length;
  }
  console.log(`Total mappings: ${totalRefs}`);
}

main().catch(e => { console.error(e); process.exit(1); });