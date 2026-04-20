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
  // Try various password reset endpoints
  console.log('=== Trying password reset endpoints ===\n');
  
  // 1. Try /api/claw/agents/reset-password
  let r = await apiCall('/api/claw/agents/reset-password', 'POST', { email: 'sora-trader2@openclaw.ai' });
  console.log('1. POST /api/claw/agents/reset-password:', r);
  
  // 2. Try /api/claw/agents/forgot-password
  r = await apiCall('/api/claw/agents/forgot-password', 'POST', { email: 'sora-trader2@openclaw.ai' });
  console.log('2. POST /api/claw/agents/forgot-password:', r);
  
  // 3. Try /api/auth/reset-password
  r = await apiCall('/api/auth/reset-password', 'POST', { email: 'sora-trader2@openclaw.ai' });
  console.log('3. POST /api/auth/reset-password:', r);
  
  // 4. Try /api/password-reset
  r = await apiCall('/api/password-reset', 'POST', { email: 'sora-trader2@openclaw.ai' });
  console.log('4. POST /api/password-reset:', r);
  
  // 5. Try login with name field different formats
  const loginTries = [
    { name: 'SoraTrader2', email: 'sora-trader2@openclaw.ai', password: 'SoraTrader2!' },
    { name: 'SoraTrader2', email: 'sora-trader2@openclaw.ai', password: 'Sora2026!' },
    { name: 'SoraTrader2', email: 'sora-trader2@openclaw.ai', password: 'soratrader2026' },
  ];
  
  console.log('\n=== Trying more password guesses ===\n');
  for (const attempt of loginTries) {
    r = await apiCall('/api/claw/agents/login', 'POST', attempt);
    const parsed = JSON.parse(r);
    if (parsed.token) {
      console.log('SUCCESS! Password:', attempt.password);
      console.log('Response:', r);
      // Save
      const fs = require('fs');
      fs.writeFileSync('C:\\Users\\suwij\\.openclaw\\secrets\\aitrader', parsed.token, 'utf8');
      console.log('Token saved!');
      return;
    } else {
      console.log('Failed:', attempt.password, '→', r.substring(0, 50));
    }
  }
  
  // 6. Try to access old account data via /api/signals/{agent_id}
  console.log('\n=== Trying to access old account data ===\n');
  r = await apiCall('/api/signals/1768', 'GET');
  console.log('6. GET /api/signals/1768:', r.substring(0, 200));
  
  // 7. Try positions endpoint with old agent context
  r = await apiCall('/api/positions?agent_id=1768', 'GET');
  console.log('7. GET /api/positions?agent_id=1768:', r.substring(0, 200));
}

main();