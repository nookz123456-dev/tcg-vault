const http = require('http');

const BASE = 'http://localhost:3099';

async function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  // 1. Pokemon EN card detail - check actual response
  console.log('=== Pokemon EN Card Detail ===');
  let r = await fetch(BASE + '/api/cards/pokemon/sv8pt5-4');
  console.log(`Status: ${r.status}`);
  try {
    const j = JSON.parse(r.body);
    console.log(`Keys: ${Object.keys(j).join(', ')}`);
    console.log(`Name: ${j.name || j.card?.name || 'N/A'}`);
  } catch { console.log(`Body: ${r.body.substring(0, 200)}`); }

  // 2. JP card detail - different ID format?
  console.log('\n=== Pokemon JP Card Detail (trying different IDs) ===');
  for (const id of ['SV8pt5-004', 'sv8pt5-4', 'SV8pt5-4', 'SV8pt5_004']) {
    r = await fetch(BASE + `/api/cards/pokemon-jp/${encodeURIComponent(id)}`);
    console.log(`${id}: ${r.status} - ${r.body.substring(0, 100)}`);
  }

  // 3. JP Set detail
  console.log('\n=== JP Set Detail ===');
  r = await fetch(BASE + '/api/sets/pokemon-jp/SV8pt5');
  console.log(`Status: ${r.status}`);
  console.log(`Body: ${r.body.substring(0, 300)}`);

  // 4. Pokemon set detail
  console.log('\n=== Pokemon EN Set Detail ===');
  r = await fetch(BASE + '/api/sets/pokemon/sv8pt5');
  console.log(`Status: ${r.status}`);
  console.log(`Body: ${r.body.substring(0, 300)}`);

  // 5. Price history
  console.log('\n=== Price History ===');
  r = await fetch(BASE + '/api/price-history?cardId=sv8pt5-4&game=pokemon');
  console.log(`Status: ${r.status}`);
  console.log(`Body: ${r.body.substring(0, 300)}`);
}

main().catch(console.error);