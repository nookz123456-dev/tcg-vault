const fs = require('fs');
const c = fs.readFileSync('src/components/TopMovers.tsx', 'utf8');
const lines = c.split('\n');
for (let i = 23; i <= 26; i++) {
  console.log((i+1) + ': [' + lines[i] + ']');
}