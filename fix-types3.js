const fs = require('fs');
let c = fs.readFileSync('src/app/marketplace/page.tsx', 'utf8');
c = c.replace('{t(label)}', '{t(label as any)}');
fs.writeFileSync('src/app/marketplace/page.tsx', c);
console.log('Fixed condition label type');