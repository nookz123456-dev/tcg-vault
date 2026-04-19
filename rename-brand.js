const fs = require('fs');
const path = require('path');

const files = [
  'src/app/page.tsx',
  'src/lib/i18n.ts',
];

for (const f of files) {
  const fp = path.join(__dirname, f);
  let content = fs.readFileSync(fp, 'utf8');
  
  // Replace brand name (not TCG as in TCGplayer, TCG card, etc.)
  content = content.replace(/TCG Vault/g, 'HoloCheck');
  content = content.replace(/tcg-vault-locale/g, 'holocheck-locale');
  
  fs.writeFileSync(fp, content, 'utf8');
  console.log(`Updated: ${f}`);
}

// Also update page.tsx footer icon from 🃏 to HoloCheck logo
let page = fs.readFileSync(path.join(__dirname, 'src/app/page.tsx'), 'utf8');
// Replace the footer icon 🃏 with a small SVG inline
page = page.replace(
  '<span className="text-xl">🃏</span>',
  `<span className="text-xl">
    <svg viewBox="0 0 32 32" className="w-5 h-5 inline-block" fill="none">
      <path d="M8 8h10v2H10v6h6v2H8V8z" fill="#6366f1"/>
      <path d="M14 16h10v2H16v6h8v2H14V16z" fill="#6366f1" opacity="0.7"/>
      <circle cx="24" cy="8" r="3" fill="#6366f1" opacity="0.5"/>
    </svg>
  </span>`
);
fs.writeFileSync(path.join(__dirname, 'src/app/page.tsx'), page, 'utf8');
console.log('Updated: src/app/page.tsx (footer icon)');

console.log('Done!');