const { execSync } = require('child_process');
const msg = 'fix: admin API env check + remove email column + error handling';
execSync('git add src/app/admin/page.tsx src/app/api/admin/route.ts src/lib/i18n.ts supabase/admin-enhancements.sql', { stdio: 'inherit', cwd: __dirname });
execSync(`git commit -m "${msg}"`, { stdio: 'inherit', cwd: __dirname });
execSync('git push origin master', { stdio: 'inherit', cwd: __dirname });
console.log('✅ Pushed!');