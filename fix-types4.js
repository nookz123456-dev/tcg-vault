const fs = require('fs');
let c = fs.readFileSync('src/app/marketplace/page.tsx', 'utf8');
c = c.replace(/t\(CONDITION_LABELS\[listing\.condition\] \|\| CONDITION_LABELS\.nm\)/g, 't((CONDITION_LABELS[listing.condition] || CONDITION_LABELS.nm) as any)');
fs.writeFileSync('src/app/marketplace/page.tsx', c);
console.log('Fixed last type error');