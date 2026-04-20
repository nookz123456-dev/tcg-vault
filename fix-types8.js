const fs = require('fs');
let c = fs.readFileSync('src/app/trades/page.tsx', 'utf8');
c = c.replace(/t\(`trades\.status\.\${offer\.status}`\)/g, 't(`trades.status.${offer.status}` as any)');
fs.writeFileSync('src/app/trades/page.tsx', c);
console.log('Fixed trades offer status type');