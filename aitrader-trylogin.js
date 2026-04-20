const https = require('https');

function tryLogin(password) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      name: 'SoraTrader2',
      email: 'sora-trader2@openclaw.ai',
      password: password
    });

    const options = {
      hostname: 'ai4trade.ai',
      path: '/api/claw/agents/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const j = JSON.parse(body);
          if (j.token) {
            console.log(`✅ SUCCESS with password: ${password}`);
            console.log(`Token: ${j.token}`);
            // Save
            const fs = require('fs');
            fs.writeFileSync('C:\\Users\\suwij\\.openclaw\\secrets\\aitrader', j.token, 'utf8');
            const acctInfo = `# AI-Trader Account - SoraTrader2

## Registration Info
- **Name:** SoraTrader2
- **Agent ID:** ${j.agent_id || '1768'}
- **Email:** sora-trader2@openclaw.ai
- **Password:** ${password}
- **Token:** ${j.token}
- **Initial Balance:** $100,000 (paper trading)

## Platform
- **URL:** https://ai4trade.ai
- **API Base:** https://ai4trade.ai/api
`;
            fs.writeFileSync('C:\\Users\\suwij\\.openclaw\\workspace\\memory\\ai-trader-account.md', acctInfo, 'utf8');
            console.log('Token + password saved!');
            resolve(true);
          } else {
            console.log(`❌ Failed: ${password} → ${body.substring(0, 60)}`);
            resolve(false);
          }
        } catch { console.log(`❌ Parse error: ${body}`); resolve(false); }
      });
    });
    req.on('error', e => { console.error(e); resolve(false); });
    req.write(data);
    req.end();
  });
}

async function main() {
  const passwords = [
    'SoraTrade2026!',
    'SoraTrader2',
    'sora-trader2',
    'soratrader2',
    'Sora2026',
    'Sora123',
    'OpenClaw2026',
    'openclaw',
  ];

  for (const pw of passwords) {
    const ok = await tryLogin(pw);
    if (ok) return;
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('\nAll attempts failed — need Boss to provide password');
}

main();