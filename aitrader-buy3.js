const https = require('https');

const TOKEN = '4bm0jb5WOX6seMa0hcfEsC_pHuZaVdWBNWX1sktNC1k';

const payload = {
  market: "crypto",
  action: "buy",
  symbol: "BTC",
  price: 74273,
  quantity: 1,
  content: "BTC Long - Boss add position. HODL + Trailing Stop.",
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
    console.log('Response:', body);
    try {
      const j = JSON.parse(body);
      if (j.signal_id || j.success) {
        console.log('Order placed successfully!');
      }
    } catch {}
  });
});

req.on('error', e => console.error(e));
req.write(data);
req.end();