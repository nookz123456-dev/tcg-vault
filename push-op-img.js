const { execSync } = require('child_process');
const msg = 'Fix One Piece mover images: use correct optcgapi.com/media/static URL';
execSync('git add -A', { stdio: 'pipe', cwd: __dirname });
execSync('git commit -m "' + msg + '"', { stdio: 'pipe', cwd: __dirname });
execSync('git push origin master', { stdio: 'pipe', cwd: __dirname });
console.log('Pushed:', msg);