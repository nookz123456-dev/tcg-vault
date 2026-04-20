const fs = require('fs');
let c = fs.readFileSync('src/app/marketplace/sell/page.tsx', 'utf8');
c = c.replace(/{t\(g\.label\)}/g, '{t(g.label as any)}');
c = c.replace(/{t\(c\.label\)}/g, '{t(c.label as any)}');
fs.writeFileSync('src/app/marketplace/sell/page.tsx', c);
console.log('Fixed sell page types');