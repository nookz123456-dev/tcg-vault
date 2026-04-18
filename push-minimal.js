const { execSync } = require('child_process');
const msg = 'Minimal redesign: all pages updated to clean style (#6366f1 accent, bg #fafbfc, white cards, no gradients)';
execSync('git add -A', { stdio: 'pipe', cwd: __dirname });
execSync(`git commit -m "${msg}"`, { stdio: 'pipe', cwd: __dirname });
execSync('git push origin master', { stdio: 'pipe', cwd: __dirname });
console.log('Pushed:', msg);