const { execSync } = require('child_process');
const msg = 'i18n: complete migration from isThai to t() - all 12 frontend files';

try {
  execSync('git add src/app/admin/page.tsx src/app/login/page.tsx src/app/seller/apply/page.tsx src/components/Navbar.tsx src/components/TopMovers.tsx src/app/badges/page.tsx src/app/trades/page.tsx src/app/alerts/page.tsx src/app/movers/page.tsx src/app/discussions/page.tsx src/app/discussions/[id]/page.tsx src/app/auth/reset-password/page.tsx', { stdio: 'inherit', cwd: __dirname });
  execSync(`git commit -m "${msg}"`, { stdio: 'inherit', cwd: __dirname });
  execSync('git push origin master', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Pushed!');
} catch (e) {
  console.error('❌ Error:', e.message);
}