const { execSync } = require('child_process')
const msg = 'Step C: Add AI Holo Score component to Pokemon EN card detail pages'
try {
  execSync('git add -A', { stdio: 'inherit', cwd: __dirname })
  execSync('git reset HEAD -- *.js node_modules .env.local aitrader-* check-* debug-* find-* fix-* push-* rename-* system-* test-* translate-* scrape-* upload-* download-* build-* create-* seed-* setup-* count-* show-* analyze-* vision_* minimal-* recolor.py resize-*', { stdio: 'inherit', cwd: __dirname })
  execSync(`git commit -m "${msg}"`, { stdio: 'inherit', cwd: __dirname })
  execSync('git push origin master', { stdio: 'inherit', cwd: __dirname })
  console.log('✅ Pushed!')
} catch (e) { console.error('❌', e.message) }