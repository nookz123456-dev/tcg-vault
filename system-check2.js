const http = require('http');

const BASE = 'http://localhost:3099';

async function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data.substring(0, 300) }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function checkAPI(path, label, expectKey) {
  try {
    const r = await fetch(BASE + path);
    const ok = r.status >= 200 && r.status < 400;
    let dataOk = true;
    if (ok && expectKey) {
      try {
        const json = JSON.parse(r.body);
        dataOk = json[expectKey] !== undefined || (Array.isArray(json) && json.length >= 0);
      } catch { dataOk = false; }
    }
    const passed = ok && dataOk;
    console.log(`${passed ? '✅' : '⚠️'} ${label}: ${r.status}${!dataOk ? ' (data missing: ' + expectKey + ')' : ''}`);
    if (!ok) console.log(`   Body: ${r.body.substring(0, 100)}`);
    return passed;
  } catch (e) {
    console.log(`❌ ${label}: ERROR - ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('=== HoloCheck API Deep Check ===\n');

  const tests = [
    // Pokemon EN search
    ['/api/cards/pokemon?keyword=pikachu&pageSize=3', 'Pokemon EN Search (pikachu)', 'data'],
    // Pokemon EN card detail
    ['/api/cards/pokemon/sv8pt5-4', 'Pokemon EN Card Detail (Pikachu ex)', 'name'],
    // Pokemon JP search
    ['/api/cards/pokemon-jp?keyword=ピカチュウ&pageSize=3', 'Pokemon JP Search (ピカチュウ)', 'data'],
    // Pokemon JP card detail
    ['/api/cards/pokemon-jp/SV8pt5-004', 'Pokemon JP Card Detail', 'name'],
    // Price history
    ['/api/price-history?cardId=sv8pt5-4&game=pokemon', 'Price History API', 'prices'],
    // Pokemon set detail
    ['/api/sets/pokemon/sv8pt5', 'Pokemon Set Detail (sv8pt5)', 'name'],
    // JP set detail
    ['/api/sets/pokemon-jp/SV8pt5', 'JP Set Detail (SV8pt5)', 'name'],
  ];

  let pass = 0, fail = 0;
  for (const [path, label, key] of tests) {
    const ok = await checkAPI(path, label, key);
    if (ok) pass++; else fail++;
    // Small delay between API calls
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n=== API Results: ${pass} passed, ${fail} failed ===`);
  
  // Also check auth-dependent APIs
  console.log('\n--- Auth-dependent APIs (expected 401 without login) ---');
  await checkAPI('/api/notifications', 'Notifications (no auth)', null);
  await checkAPI('/api/profiles', 'Profiles (no auth)', null);
  await checkAPI('/api/wishlists', 'Wishlists (no auth)', null);
  await checkAPI('/api/trades', 'Trades (no auth)', null);
}

main().catch(console.error);