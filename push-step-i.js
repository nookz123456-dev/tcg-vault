const { execSync } = require('child_process')
const msg = 'Step I: Redesign homepage - compact hero, market movers, quick nav, streamlined features'
try {
  execSync('git add src/app/page.tsx', { stdio: 'inherit', cwd: __dirname })
  execSync(`git commit -m "${msg}"`, { stdio: 'inherit', cwd: __dirname })
  execSync('git push origin master', { stdio: 'inherit', cwd: __dirname })
  console.log('✅ Pushed!')
} catch (e) { console.error('❌', e.message) }