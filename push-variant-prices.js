const { execSync } = require('child_process');
const cwd = 'C:\\Users\\suwij\\.openclaw\\workspace\\tcg-vault';

try {
  execSync('git add "src/app/card/pokemon/[id]/page.tsx" "src/app/card/pokemon-jp/[id]/page.tsx" "src/lib/i18n.ts"', { cwd, stdio: 'pipe' });
  console.log('Staged source files');
} catch(e) { console.log('Stage error:', e.message); }

try {
  execSync('git commit -m "fix: show Variant Prices from TCGplayer (priceBreakdown) on card detail page"', { cwd, stdio: 'pipe' });
  console.log('Committed!');
} catch(e) { console.log('Commit error:', e.message); }

try {
  execSync('git push origin master', { cwd, stdio: 'pipe' });
  console.log('Pushed to Vercel!');
} catch(e) { console.log('Push error:', e.stderr?.toString() || e.message); }