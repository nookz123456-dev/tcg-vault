const fs = require('fs');
const path = 'C:/Users/suwij/.openclaw/workspace/tcg-vault/src/app/login/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// Fix: lines where className attribute has opening " but no closing " on same line
// and the next line starts with > (JSX closing)
// Pattern: className="...disabled:opacity-50 disabled:cursor-not-allowed \n >
c = c.replace(
  /className="([^"]*?)disabled:opacity-50 disabled:cursor-not-allowed\s*\n\s*>/g,
  (match, before) => {
    return `className="${before}disabled:opacity-50 disabled:cursor-not-allowed"\n          >`;
  }
);

fs.writeFileSync(path, c, 'utf8');
console.log('Fixed login/page.tsx v3');