const https = require('https');

const data = JSON.stringify({
  name: 'SoraTrader2',
  email: 'sora-trader2@openclaw.ai',
  password: 'soratrader2'
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
    console.log('Login response:', body);
    try {
      const j = JSON.parse(body);
      if (j.token) {
        const fs = require('fs');
        fs.writeFileSync('C:\\Users\\suwij\\.openclaw\\secrets\\aitrader', j.token, 'utf8');
        console.log('New token saved!');
      }
    } catch {}
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();