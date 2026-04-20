const fs = require('fs');
let c = fs.readFileSync('src/app/marketplace/[id]/page.tsx', 'utf8');
c = c.replace(/t\(CONDITION_LABELS\[listing\.condition\] \|\| CONDITION_LABELS\.nm\)/g, 't((CONDITION_LABELS[listing.condition] || CONDITION_LABELS.nm) as any)');
fs.writeFileSync('src/app/marketplace/[id]/page.tsx', c);
console.log('Fixed CONDITION_LABELS type');