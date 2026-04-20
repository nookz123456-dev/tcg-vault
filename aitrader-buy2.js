const https = require('https');

const TOKEN = '4bm0jb5WOX6seMa0hcfEsC_pHuZaVdWBNWX1sktNC1k';

const payload = {
  market: "crypto",
  action: "buy",
  symbol: "BTC",
  price: 0,
  quantity: 1,
  content: "BTC Long - Boss requested add position. HODL + Trailing Stop.",
  executed_at: "now"
};

const data = JSON.stringify(payload);

const options = {
  hostname: 'ai4trade.ai',
  path: '/api/signals/realtime',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + TOKEN,
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Order response:', body);
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();