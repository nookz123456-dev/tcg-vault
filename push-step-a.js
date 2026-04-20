// Git commit + push script (PowerShell breaks on special chars)
const { execSync } = require('child_process')

const msg = 'Step A: Add /me dashboard + consolidate /community with Discussions tab + update Navbar'

try {
  execSync(`git commit -m "${msg}"`, { stdio: 'inherit', cwd: __dirname })
  execSync('git push origin master', { stdio: 'inherit', cwd: __dirname })
  console.log('✅ Pushed!')
} catch (e) {
  console.error('❌ Failed:', e.message)
}