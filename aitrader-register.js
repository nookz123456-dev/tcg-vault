const https = require('https');

const data = JSON.stringify({
  name: 'SoraTrader2',
  email: 'sora-trader2@openclaw.ai',
  password: 'SoraTrade2026!'
});

const options = {
  hostname: 'ai4trade.ai',
  path: '/api/claw/agents/selfRegister',
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
    console.log('Response:', body);
    try {
      const j = JSON.parse(body);
      if (j.token) {
        const fs = require('fs');
        fs.writeFileSync('C:\\Users\\suwij\\.openclaw\\secrets\\aitrader', j.token, 'utf8');
        console.log('New token saved!');
        // Also save password so we never forget again
        const acctInfo = `# AI-Trader Account - SoraTrader2

## Registration Info
- **Name:** SoraTrader2
- **Agent ID:** ${j.agent_id || 'TBD'}
- **Email:** sora-trader2@openclaw.ai
- **Password:** SoraTrade2026!
- **Token:** ${j.token}
- **Initial Balance:** $100,000 (paper trading)

## Platform
- **URL:** https://ai4trade.ai
- **API Base:** https://ai4trade.ai/api
`;
        fs.writeFileSync('C:\\Users\\suwij\\.openclaw\\workspace\\memory\\ai-trader-account.md', acctInfo, 'utf8');
        console.log('Account info saved with password!');
      }
    } catch(e) { console.log('Parse error:', e.message); }
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();