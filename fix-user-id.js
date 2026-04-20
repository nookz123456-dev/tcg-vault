const fs = require('fs');
const files = [
  'src/app/marketplace/[id]/page.tsx',
  'src/app/marketplace/sell/page.tsx',
  'src/app/orders/page.tsx',
];
for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/user\.user\.id/g, 'user.id');
  fs.writeFileSync(f, c);
  console.log(`Fixed: ${f}`);
}