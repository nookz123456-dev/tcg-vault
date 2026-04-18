const { execSync } = require('child_process');
const msg = 'One Piece search: add client-side keyword filter (name, family, attribute, color, etc.)';
execSync('git add -A', { stdio: 'pipe', cwd: __dirname });
execSync('git commit -m "' + msg + '"', { stdio: 'pipe', cwd: __dirname });
execSync('git push origin master', { stdio: 'pipe', cwd: __dirname });
console.log('Pushed:', msg);