const { execSync } = require('child_process');
const msg = 'Fix: wrap t() calls in JSX curly braces (was showing literal text)';
execSync('git add -A', { stdio: 'pipe', cwd: __dirname });
execSync('git commit -m "' + msg + '"', { stdio: 'pipe', cwd: __dirname });
execSync('git push origin master', { stdio: 'pipe', cwd: __dirname });
console.log('Pushed:', msg);