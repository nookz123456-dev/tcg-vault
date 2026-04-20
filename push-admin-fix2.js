const { execSync } = require('child_process');
execSync('git add src/app/api/admin/route.ts', { stdio: 'inherit', cwd: __dirname });
execSync('git commit -m "fix: admin API body-already-read error"', { stdio: 'inherit', cwd: __dirname });
execSync('git push origin master', { stdio: 'inherit', cwd: __dirname });
console.log('✅ Pushed!');