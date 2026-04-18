const { execSync } = require('child_process');
const msg = 'Minimal redesign: card detail pages (pokemon, pokemon-jp, onepiece)';
execSync('git add -A', { stdio: 'pipe', cwd: __dirname });
execSync('git commit -m "' + msg + '"', { stdio: 'pipe', cwd: __dirname });
execSync('git push origin master', { stdio: 'pipe', cwd: __dirname });
console.log('Pushed:', msg);