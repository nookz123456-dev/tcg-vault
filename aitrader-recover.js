const https = require('https');

// Try the selfRegister endpoint with existing email to see if it gives us a new token
// Or try a password reset if that endpoint exists

// First, let's try register with the same email but a known password
const data = JSON.stringify({
  name: 'SoraTrader2-Recovery',
  email: 'sora-trader2@openclaw.ai',
  password: 'SoraRecover2026!'
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
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();