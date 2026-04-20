const fs = require('fs');
let c = fs.readFileSync('src/app/orders/page.tsx', 'utf8');
c = c.replace("t(STATUS_LABELS[s])", "t(STATUS_LABELS[s] as any)");
fs.writeFileSync('src/app/orders/page.tsx', c);
console.log('Fixed orders page types');