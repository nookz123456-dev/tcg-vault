const fs = require('fs');
const files = [
  'src/app/discussions/[id]/page.tsx',
  'src/app/auth/reset-password/page.tsx',
  'src/components/Navbar.tsx',
  'src/app/badges/page.tsx',
  'src/app/trades/page.tsx',
  'src/components/TopMovers.tsx',
];

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const isThaiLines = [];
    lines.forEach((l, i) => {
      if (l.includes('isThai')) {
        isThaiLines.push(`  L${i+1}: ${l.trim()}`);
      }
    });
    if (isThaiLines.length > 0) {
      console.log(`\n=== ${file} (${isThaiLines.length}x) ===`);
      isThaiLines.forEach(l => console.log(l));
    }
  } catch (e) {
    console.log(`Error reading ${file}: ${e.message}`);
  }
}