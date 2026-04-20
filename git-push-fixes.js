const { execSync } = require('child_process');
const cwd = 'C:\\Users\\suwij\\.openclaw\\workspace\\tcg-vault';

try {
  execSync('git add -A', { cwd, stdio: 'pipe' });
  console.log('Staged all changes');
} catch(e) { console.log('Stage error:', e.message); }

try {
  const msg = 'Fix API issues: EN card ID lowercase, JP card zero-padding, JP set 404 handler, metadataBase';
  execSync(`git commit -m "${msg}"`, { cwd, stdio: 'pipe' });
  console.log('Committed!');
} catch(e) { console.log('Commit error:', e.message); }

try {
  execSync('git push origin master', { cwd, stdio: 'pipe' });
  console.log('Pushed to Vercel!');
} catch(e) { console.log('Push error:', e.message); }