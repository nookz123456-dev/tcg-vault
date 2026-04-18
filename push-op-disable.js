const { execSync } = require('child_process');
const msg = 'Disable One Piece across all UI: search, sets, movers, homepage (temporarily)';
execSync('git add -A', { stdio: 'pipe', cwd: __dirname });
execSync('git commit -m "' + msg + '"', { stdio: 'pipe', cwd: __dirname });
execSync('git push origin master', { stdio: 'pipe', cwd: __dirname });
console.log('Pushed:', msg);