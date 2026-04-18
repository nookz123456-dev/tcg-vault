const fs = require('fs');
const path = require('path');

// Fix t() calls not wrapped in {} in JSX
// Pattern: >t("key")< should be >{t("key")}<
// But >{t("key")}< is already correct

const files = [
  'C:/Users/suwij/.openclaw/workspace/tcg-vault/src/app/card/pokemon/[id]/page.tsx',
  'C:/Users/suwij/.openclaw/workspace/tcg-vault/src/app/sealed/page.tsx',
];

let totalFixes = 0;

for (const fp of files) {
  let content = fs.readFileSync(fp, 'utf8');
  const original = content;
  
  // Fix pattern: >t("key")< -> >{t("key")}<
  // This handles JSX text nodes where t() is rendered as literal text
  content = content.replace(/>(\s*)t\("([\w.]+)"\)(\s*)</g, '>$1{t("$2")}$3<');
  
  // Also fix: >t('key')< -> >{t('key')}<
  content = content.replace(/>(\s*)t\('([\w.]+)'\)(\s*)</g, '>$1{t(\'$2\')}$3<');
  
  if (content !== original) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log('Fixed: ' + path.basename(path.dirname(fp)) + '/' + path.basename(fp));
    // Count fixes
    const origLines = original.split('\n');
    const newLines = content.split('\n');
    for (let i = 0; i < origLines.length; i++) {
      if (origLines[i] !== newLines[i]) {
        console.log('  Line ' + (i+1) + ': ' + newLines[i].trim().substring(0, 100));
        totalFixes++;
      }
    }
  } else {
    console.log('No changes: ' + path.basename(fp));
  }
}

// Now check pokemon-jp and onepiece card pages too
const jpPage = 'C:/Users/suwij/.openclaw/workspace/tcg-vault/src/app/card/pokemon-jp/[id]/page.tsx';
const opPage = 'C:/Users/suwij/.openclaw/workspace/tcg-vault/src/app/card/onepiece/[id]/page.tsx';

for (const fp of [jpPage, opPage]) {
  let content = fs.readFileSync(fp, 'utf8');
  const original = content;
  
  // These pages use useCardStrings which returns s() function
  // Check for similar pattern: >s("key")< without {}
  content = content.replace(/>(\s*)s\("([\w.]+)"\)(\s*)</g, '>$1{s("$2")}$3<');
  content = content.replace(/>(\s*)s\('([\w.]+)'\)(\s*)</g, '>$1{s(\'$2\')}$3<');
  
  if (content !== original) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log('Fixed: ' + path.basename(path.dirname(fp)) + '/' + path.basename(fp));
    totalFixes++;
  }
}

console.log('\nTotal fixes: ' + totalFixes);