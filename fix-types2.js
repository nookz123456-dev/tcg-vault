const fs = require('fs');

// Fix marketplace/page.tsx - dynamic key access needs 'as any'
let c = fs.readFileSync('src/app/marketplace/page.tsx', 'utf8');
c = c.replace(/{t\(g\.label\)}/g, '{t(g.label as any)}');
c = c.replace(/{t\(s\.label\)}/g, '{t(s.label as any)}');
c = c.replace(/t\(CONDITION_LABELS\[cond\]\)/g, 't(CONDITION_LABELS[cond] as any)');
fs.writeFileSync('src/app/marketplace/page.tsx', c);

// Fix orders/page.tsx
c = fs.readFileSync('src/app/orders/page.tsx', 'utf8');
c = c.replace(/t\(STATUS_LABELS\[order\.status\] \|\| STATUS_LABELS\.pending\)/g, 't((STATUS_LABELS[order.status] || STATUS_LABELS.pending) as any)');
fs.writeFileSync('src/app/orders/page.tsx', c);

console.log('Fixed all dynamic key types');