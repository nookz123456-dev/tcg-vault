const https = require('https');

const NEW_TOKEN = '4bm0jb5WOX6seMa0hcfEsC_pHuZaVdWBNWX1sktNC1k';

function apiCall(path, method, body) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'ai4trade.ai',
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + NEW_TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const data = body ? JSON.stringify(body) : null;
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let rbody = '';
      res.on('data', chunk => rbody += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: rbody }));
    });
    req.on('error', e => resolve({ status: 0, body: 'Error: ' + e.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // 1. Close the BTC position on new account (sell to close)
  console.log('=== Closing BTC position on new account (2969) ===');
  let r = await apiCall('/api/signals/realtime', 'POST', {
    market: 'crypto',
    action: 'sell',
    symbol: 'BTC',
    price: 0,
    quantity: 1,
    content: 'Closing position - switching back to old account',
    executed_at: 'now'
  });
  console.log('Close position:', r.body);

  // 2. Try to delete the new account
  console.log('\n=== Trying to delete new account (2969) ===');
  
  // Try various delete endpoints
  r = await apiCall('/api/claw/agents/me', 'DELETE');
  console.log('DELETE /api/claw/agents/me:', r.status, r.body.substring(0, 200));
  
  r = await apiCall('/api/claw/agents/2969', 'DELETE');
  console.log('DELETE /api/claw/agents/2969:', r.status, r.body.substring(0, 200));

  // 3. Now get old account full signal history
  console.log('\n=== Old Account (1768) Full Signal History ===');
  r = await apiCall('/api/signals/1768?limit=100', 'GET');
  const signals = JSON.parse(r.body);
  if (signals.signals) {
    console.log('Total signals:', signals.signals.length);
    for (const s of signals.signals) {
      console.log(`#${s.signal_id} | ${s.message_type} | ${s.side || '?'} ${s.symbol || '?'} @ $${s.entry_price || s.price || '?'} | PnL: $${s.pnl || 0} | ${s.timestamp || ''}`);
    }
  }
  
  // 4. Get old account positions
  console.log('\n=== Old Account (1768) Current Positions ===');
  r = await apiCall('/api/positions?agent_id=1768', 'GET');
  console.log(r.body);
}

main();