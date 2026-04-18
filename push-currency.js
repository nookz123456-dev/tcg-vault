const { execSync } = require('child_process');
const msg = 'Add USD/THB currency toggle to TopMovers and /movers page';
execSync('git add -A', { stdio: 'pipe', cwd: __dirname });
execSync('git commit -m "' + msg + '"', { stdio: 'pipe', cwd: __dirname });
execSync('git push origin master', { stdio: 'pipe', cwd: __dirname });
console.log('Pushed:', msg);