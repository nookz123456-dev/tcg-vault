const fs = require('fs');
let c = fs.readFileSync('src/app/trades/page.tsx', 'utf8');
c = c.replace(/t\(`trades\.status\.\${f}`\)/g, 't(`trades.status.${f}` as any)');
fs.writeFileSync('src/app/trades/page.tsx', c);
console.log('Fixed trades page types');