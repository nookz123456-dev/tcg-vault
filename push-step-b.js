const { execSync } = require('child_process')
const msg = 'Step B: Add Cmd+K Quick Search component (global keyboard shortcut)'
try {
  execSync('git add src/components/CmdKSearch.tsx src/app/layout.tsx src/lib/i18n.ts', { stdio: 'inherit', cwd: __dirname })
  execSync(`git commit -m "${msg}"`, { stdio: 'inherit', cwd: __dirname })
  execSync('git push origin master', { stdio: 'inherit', cwd: __dirname })
  console.log('✅ Pushed!')
} catch (e) { console.error('❌', e.message) }