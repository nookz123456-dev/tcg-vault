const http = require('http');

const BASE = 'http://localhost:3099';

async function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data.substring(0, 200) }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function checkRoute(path, label) {
  try {
    const r = await fetch(BASE + path);
    const ok = r.status >= 200 && r.status < 400;
    console.log(`${ok ? '✅' : '❌'} ${label}: ${r.status}`);
    if (!ok) console.log(`   Body: ${r.body.substring(0, 100)}`);
    return ok;
  } catch (e) {
    console.log(`❌ ${label}: ERROR - ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('=== HoloCheck System Check ===\n');

  // Wait for server
  console.log('Waiting for server...');
  for (let i = 0; i < 15; i++) {
    try { await fetch(BASE + '/'); break; } catch { 
      await new Promise(r => setTimeout(r, 1000)); 
    }
  }

  const routes = [
    // Pages
    ['/', 'Homepage'],
    ['/search', 'Search Page'],
    ['/sets', 'Sets Page'],
    ['/sealed', 'Sealed Page'],
    ['/movers', 'Movers Page'],
    ['/collection', 'Collection Page'],
    ['/community', 'Community Page'],
    ['/discussions', 'Discussions Page'],
    ['/badges', 'Badges Page'],
    ['/alerts', 'Alerts Page'],
    ['/trades', 'Trades Page'],
    ['/login', 'Login Page'],
    ['/seller/apply', 'Seller Apply Page'],
    ['/notifications', 'Notifications Page'],
    
    // API routes
    ['/api/sets/pokemon', 'API: Pokemon Sets'],
    ['/api/sets/pokemon-jp', 'API: JP Sets'],
    ['/api/sealed', 'API: Sealed'],
    ['/api/movers', 'API: Movers'],
    ['/api/trending', 'API: Trending'],
    ['/api/rates', 'API: Exchange Rates'],
    ['/api/badges', 'API: Badges'],
    ['/api/discussions/boards', 'API: Discussion Boards'],
  ];

  let pass = 0, fail = 0;
  for (const [path, label] of routes) {
    const ok = await checkRoute(path, label);
    if (ok) pass++; else fail++;
  }

  console.log(`\n=== Results: ${pass} passed, ${fail} failed ===`);
}

main().catch(console.error);