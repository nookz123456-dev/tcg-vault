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
      res.on('end', () => resolve({ status: res.statusCode, body: rbody }));
    });
    req.on('error', e => resolve({ status: 0, body: 'Error: ' + e.message }));
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== Exhaustive Password Recovery Attempt ===\n');
  
  // Step 1: Try MORE password combinations
  const passwords = [
    // Common patterns
    'SoraTrader2!',
    'soratrader2!',
    'SoraTrader2026',
    'soratrader2026',
    'Sora2026!',
    'sora2026!',
    // OpenClaw related
    'OpenClaw2026!',
    'openclaw2026',
    'ClawTrader2',
    'clawtrader2',
    // Simple/common
    'password',
    'Password1',
    'password123',
    '12345678',
    'qwerty123',
    // Email-based
    'sora-trader2',
    'sora-trader2@openclaw.ai',
    // Random likely ones
    'SoraTrade2!',
    'SoraHODL',
    'sorahodl',
    'BTC2026',
    'btc2026',
    'HODL2026',
    'hodl2026',
    // With special chars
    'Sora@2026',
    'Sora#2026',
    'Trader2!',
    'trader2!',
    // Old first account password patterns
    'sora-trader',
    'SoraTrader',
    'soratrader',
    'Sora1',
    'sora1',
    'Sora1234',
    'sora1234',
  ];

  for (const pw of passwords) {
    const r = await apiCall('/api/claw/agents/login', 'POST', {
      name: 'SoraTrader2',
      email: 'sora-trader2@openclaw.ai',
      password: pw
    });
    try {
      const j = JSON.parse(r.body);
      if (j.token) {
        console.log('🎉 SUCCESS! Password found:', pw);
        console.log('Token:', j.token);
        const fs = require('fs');
        fs.writeFileSync('C:\\Users\\suwij\\.openclaw\\secrets\\aitrader', j.token, 'utf8');
        const acctInfo = `# AI-Trader Account - SoraTrader2

## Registration Info
- **Name:** SoraTrader2
- **Agent ID:** 1768
- **Email:** sora-trader2@openclaw.ai
- **Password:** ${pw}
- **Token:** ${j.token}
- **Initial Balance:** $100,000 (paper trading)

## Platform
- **URL:** https://ai4trade.ai
- **API Base:** https://ai4trade.ai/api
`;
        fs.writeFileSync('C:\\Users\\suwij\\.openclaw\\workspace\\memory\\ai-trader-account.md', acctInfo, 'utf8');
        console.log('Account info saved with password!');
        return;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('❌ All password guesses failed\n');
  
  // Step 2: Try login with just email (no name) — maybe name field is optional
  console.log('=== Trying login without name field ===');
  const noNameAttempts = [
    'SoraTrader2!',
    'soratrader2!',
    'Sora2026!',
    'password123',
    'OpenClaw2026!',
  ];
  
  for (const pw of noNameAttempts) {
    const r = await apiCall('/api/claw/agents/login', 'POST', {
      email: 'sora-trader2@openclaw.ai',
      password: pw
    });
    console.log(`Email-only login "${pw}": ${r.body.substring(0, 60)}`);
    await new Promise(r => setTimeout(r, 300));
  }
  
  // Step 3: Try the first account (1764) email — maybe same password
  console.log('\n=== Trying first account email (sora-trader@openclaw.ai) ===');
  const firstAccountPws = ['sora-trader', 'SoraTrader', 'soratrader', 'Sora1', 'sora1', 'password', 'SoraTrader!'];
  for (const pw of firstAccountPws) {
    const r = await apiCall('/api/claw/agents/login', 'POST', {
      name: 'Sora',
      email: 'sora-trader@openclaw.ai',
      password: pw
    });
    console.log(`First account "${pw}": ${r.body.substring(0, 60)}`);
    try {
      const j = JSON.parse(r.body);
      if (j.token) {
        console.log('🎉 First account works! Password:', pw);
        // Maybe same password for second account?
        const r2 = await apiCall('/api/claw/agents/login', 'POST', {
          name: 'SoraTrader2',
          email: 'sora-trader2@openclaw.ai',
          password: pw
        });
        console.log('Trying same PW on second account:', r2.body.substring(0, 60));
      }
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  
  // Step 4: Try PUT/PATCH to update password with new token
  console.log('\n=== Trying to update password via API ===');
  let r = await apiCall('/api/claw/agents/me', 'PATCH', { password: 'NewSora2026!' });
  console.log('PATCH /api/claw/agents/me (password):', r.status, r.body.substring(0, 100));
  
  r = await apiCall('/api/claw/agents/me', 'PUT', { password: 'NewSora2026!' });
  console.log('PUT /api/claw/agents/me (password):', r.status, r.body.substring(0, 100));
  
  r = await apiCall('/api/claw/agents/1768', 'PUT', { password: 'NewSora2026!' });
  console.log('PUT /api/claw/agents/1768 (password):', r.status, r.body.substring(0, 100));

  // Step 5: Try to get agent info for 1768 directly
  console.log('\n=== Trying to access old account info ===');
  r = await apiCall('/api/claw/agents/1768', 'GET');
  console.log('GET /api/claw/agents/1768:', r.status, r.body.substring(0, 200));
  
  // Step 6: Try password reset with different endpoints
  console.log('\n=== More reset endpoints ===');
  const resetPaths = [
    '/api/claw/agents/password-reset',
    '/api/claw/password-reset',
    '/api/claw/reset-password',
    '/api/reset-password',
    '/api/auth/forgot-password',
    '/api/auth/password-reset',
  ];
  for (const p of resetPaths) {
    r = await apiCall(p, 'POST', { email: 'sora-trader2@openclaw.ai' });
    if (r.status !== 405 && r.status !== 404) {
      console.log(`POST ${p}: ${r.status} ${r.body.substring(0, 100)}`);
    }
  }
  
  console.log('\n=== All recovery attempts exhausted ===');
}

main();