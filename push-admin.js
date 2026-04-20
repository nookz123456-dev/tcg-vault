const { execSync } = require('child_process');
const msg = 'admin: add marketplace tab, signup trend, ban reasons, CSV export, disputed orders, listing management';

try {
  execSync('git add src/app/admin/page.tsx src/app/api/admin/route.ts src/lib/i18n.ts supabase/admin-enhancements.sql', { stdio: 'inherit', cwd: __dirname });
  execSync(`git commit -m "${msg}"`, { stdio: 'inherit', cwd: __dirname });
  execSync('git push origin master', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Pushed!');
} catch (e) {
  console.error('❌ Error:', e.message);
}