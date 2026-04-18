const fs = require('fs');
const path = 'C:/Users/suwij/.openclaw/workspace/tcg-vault/src/app/login/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// Fix broken lines: className="... transition-all disabled:opacity-5\n0..."
// Pattern: transition-all disabled:opacity-5 followed by newline then 0 disabled:cursor
c = c.replace(/transition-all disabled:opacity-5\r?\n\s*0 disabled:cursor-not-allowed \r?\n/g, 
              'transition-all disabled:opacity-50 disabled:cursor-not-allowed"\n');

// Fix lines ending with just transition-all + space + newline (broken className)
c = c.replace(/transition-all \r?\n\s*disabled:opacity-50 disabled:cursor-not-allowed \r?\n/g,
              'transition-all disabled:opacity-50 disabled:cursor-not-allowed"\n');

// Fix lines ending with transition-all + trailing space + newline without closing quote
c = c.replace(/transition-all \r?\n/g, (match) => {
  // Only fix if the line doesn't end with a quote
  return match;
});

// General fix: any className line ending with space+newline instead of quote+newline  
const lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // If line has className=" but doesn't end with " and ends with space
  if (line.includes('className="') && line.trimEnd().endsWith(' ') && !line.trimEnd().endsWith('"')) {
    lines[i] = line.trimEnd() + '"';
  }
  // Fix broken disabled:opacity-5\n0 pattern
  if (line.includes('disabled:opacity-5') && !line.includes('disabled:opacity-50')) {
    lines[i] = line.replace('disabled:opacity-5', 'disabled:opacity-50');
  }
}

c = lines.join('\n');
fs.writeFileSync(path, c, 'utf8');
console.log('Fixed login/page.tsx');