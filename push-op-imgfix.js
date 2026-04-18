const { execSync } = require('child_process');
const msg = 'Fix One Piece card images: use card ID (OP01-022) instead of name for links and detail page';
execSync('git add -A', { stdio: 'pipe', cwd: __dirname });
execSync('git commit -m "' + msg + '"', { stdio: 'pipe', cwd: __dirname });
execSync('git push origin master', { stdio: 'pipe', cwd: __dirname });
console.log('Pushed:', msg);