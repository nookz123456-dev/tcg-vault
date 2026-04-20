const fs = require('fs');
const content = fs.readFileSync('src/app/login/page.tsx', 'utf8');
const lines = content.split('\n');
let count = 0;
lines.forEach((l, i) => {
  if (l.includes('isThai')) {
    count++;
    console.log(`L${i+1}: ${l.trim()}`);
  }
});
console.log(`\nTotal: ${count} isThai`);