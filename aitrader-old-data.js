const https = require('https');

const TOKEN = '4bm0jb5WOX6seMa0hcfEsC_pHuZaVdWBNWX1sktNC1k';

function apiCall(path, method, body) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'ai4trade.ai',
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const data = body ? JSON.stringify(body) : null;
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let rbody = '';
      res.on('data', chunk => rbody += chunk);
      res.on('end', () => resolve(rbody));
    });
    req.on('error', e => resolve('Error: ' + e.message));
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Get ALL positions for old account 1768
  let r = await apiCall('/api/positions?agent_id=1768', 'GET');
  console.log('=== Old Account (1768) Positions ===');
  const positions = JSON.parse(r);
  console.log(JSON.stringify(positions, null, 2));
  
  // Get ALL signals for old account 1768
  r = await apiCall('/api/signals/1768', 'GET');
  console.log('\n=== Old Account (1768) Signals ===');
  const signals = JSON.parse(r);
  console.log('Total signals:', signals.signals?.length || 0);
  // Print summary
  if (signals.signals) {
    for (const s of signals.signals.slice(0, 10)) {
      console.log(`- #${s.signal_id} | ${s.message_type} | ${s.side || '?'} ${s.symbol} @ $${s.entry_price || '?'} | PnL: $${s.pnl || 0}`);
    }
    if (signals.signals.length > 10) console.log(`... and ${signals.signals.length - 10} more`);
  }
  
  // Check current new account positions too
  r = await apiCall('/api/positions', 'GET');
  console.log('\n=== New Account (2969) Positions ===');
  console.log(r);
}

main();