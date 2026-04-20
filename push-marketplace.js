const { execSync } = require('child_process');
const msg = 'marketplace: add buy/sell system - listings, orders, sell page + marketplace i18n keys';

try {
  execSync('git add src/app/marketplace/ src/app/orders/page.tsx src/app/api/marketplace/route.ts src/app/api/orders/route.ts src/lib/i18n.ts src/components/Navbar.tsx supabase/marketplace-schema.sql src/app/badges/page.tsx src/app/trades/page.tsx src/app/login/page.tsx', { stdio: 'inherit', cwd: __dirname });
  execSync(`git commit -m "${msg}"`, { stdio: 'inherit', cwd: __dirname });
  execSync('git push origin master', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Pushed!');
} catch (e) {
  console.error('❌ Error:', e.message);
}