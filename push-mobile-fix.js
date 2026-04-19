const { execSync } = require('child_process');

try {
  execSync('git add -A', { cwd: __dirname, stdio: 'inherit' });
  execSync('git commit -m "Fix: mobile responsive homepage + HoloCheck rebrand polish"', { cwd: __dirname, stdio: 'inherit' });
  execSync('git push origin master', { cwd: __dirname, stdio: 'inherit' });
  console.log('✅ Pushed!');
} catch (e) {
  console.error('Git error:', e.message);
  process.exit(1);
}