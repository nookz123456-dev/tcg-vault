const fs = require('fs');
const path = require('path');

// Only change visible brand name strings, NOT API keys/variable names
const replacements = [
  // Login page heading
  { file: 'src/app/login/page.tsx', from: '>TCG Vault</h1>', to: '>HoloCheck</h1>' },
  // Reset password page heading  
  { file: 'src/app/auth/reset-password/page.tsx', from: '>TCG Vault</h1>', to: '>HoloCheck</h1>' },
  // One Piece route user-agent
  { file: 'src/app/api/sets/onepiece/route.ts', from: "'TCGVault/1.0'", to: "'HoloCheck/1.0'" },
  // i18n footer description  
  { file: 'src/lib/i18n.ts', from: "'home.footer.desc': { th: 'ฐานข้อมูลการ์ด TCG ที่ครบที่สุด สำหรับนักสะสมไทย'", to: "'home.footer.desc': { th: 'ฐานข้อมูลการ์ดโปเกม่อนที่ครบที่สุด สำหรับนักสะสมไทย'" },
  // i18n hero title
  { file: 'src/lib/i18n.ts', from: "'home.hero.title': { th: 'ติดตามราคาการ์ด TCG ทุกเซ็ต'", to: "'home.hero.title': { th: 'ตรวจสอบราคาการ์ดโปเกม่อนทุกเซ็ต'" },
  // currency.ts comment
  { file: 'src/lib/currency.ts', from: '// Currency conversion utility for TCG Vault', to: '// Currency conversion utility for HoloCheck' },
];

for (const r of replacements) {
  const fp = path.join(__dirname, r.file);
  let content = fs.readFileSync(fp, 'utf8');
  if (content.includes(r.from)) {
    content = content.replace(r.from, r.to);
    fs.writeFileSync(fp, content, 'utf8');
    console.log(`✅ ${r.file}`);
  } else {
    console.log(`⚠️ Not found in ${r.file}: ${r.from.substring(0, 50)}...`);
  }
}

// Also update User-Agent strings across all API files
const apiFiles = [
  'src/app/api/sets/pokemon-jp/route.ts',
  'src/app/api/sets/pokemon-jp/[setId]/route.ts',
  'src/lib/tcgdex-jp-api.ts',
  'src/lib/pokemon-jp-names.ts',
  'src/lib/onepiece-api.ts',
];

for (const f of apiFiles) {
  const fp = path.join(__dirname, f);
  if (!fs.existsSync(fp)) continue;
  let content = fs.readFileSync(fp, 'utf8');
  const updated = content.replace(/'TCGVault\/1\.0'/g, "'HoloCheck/1.0'");
  if (content !== updated) {
    fs.writeFileSync(fp, updated, 'utf8');
    console.log(`✅ ${f} (User-Agent)`);
  }
}

console.log('Done!');