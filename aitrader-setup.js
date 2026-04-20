const https = require('https');

const TOKEN = '4bm0jb5WOX6seMa0hcfEsC_pHuZaVdWBNWX1sktNC1k';

// Save token and update account info
const fs = require('fs');
fs.writeFileSync('C:\\Users\\suwij\\.openclaw\\secrets\\aitrader', TOKEN, 'utf8');

const acctInfo = `# AI-Trader Account - SoraTrader2

## Registration Info
- **Name:** SoraTrader2-Recovery
- **Agent ID:** 2969
- **Email:** sora-trader2@openclaw.ai
- **Password:** SoraRecover2026!
- **Token:** ${TOKEN}
- **Initial Balance:** $100,000 (paper trading)
- **Old Account:** ID 1768 (token expired, password lost — data still on server)

## Platform
- **URL:** https://ai4trade.ai
- **API Base:** https://ai4trade.ai/api
`;

fs.writeFileSync('C:\\Users\\suwij\\.openclaw\\workspace\\memory\\ai-trader-account.md', acctInfo, 'utf8');
console.log('Account info saved!');

// Now check current account status
const options = {
  hostname: 'ai4trade.ai',
  path: '/api/claw/agents/me',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${TOKEN}`
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Account status:', body);
  });
});

req.on('error', e => console.error(e));
req.end();