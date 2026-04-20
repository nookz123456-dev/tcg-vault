const fs = require('fs');
const path = require('path');

function findFiles(dir, pattern) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      results.push(...findFiles(fullPath, pattern));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('isThai')) {
        // Count occurrences
        const lines = content.split('\n');
        const isThaiLines = lines.filter(l => l.includes('isThai'));
        results.push({ file: fullPath.replace(/\\/g, '/').split('tcg-vault/')[1] || fullPath, count: isThaiLines.length });
      }
    }
  }
  return results;
}

const results = findFiles('src', 'isThai');
console.log(`Files using isThai: ${results.length}\n`);
results.sort((a, b) => b.count - a.count);
results.forEach(r => console.log(`  ${r.count}x  ${r.file}`));