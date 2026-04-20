const { execSync } = require('child_process');
const cwd = 'C:\\Users\\suwij\\.openclaw\\workspace\\tcg-vault';

// Reset staging area completely
execSync('git reset HEAD', { cwd, stdio: 'pipe' });
console.log('Reset staging area');

// Only add the 4 fixed source files
const fixedFiles = [
  'src/app/api/cards/pokemon/[id]/route.ts',
  'src/app/api/cards/pokemon-jp/[id]/route.ts',
  'src/app/api/sets/pokemon-jp/[setId]/route.ts',
  'src/app/layout.tsx',
];

for (const f of fixedFiles) {
  execSync(`git add "${f}"`, { cwd, stdio: 'pipe' });
  console.log(`Staged: ${f}`);
}

// Check what's staged
const status = execSync('git status --short', { cwd }).toString();
console.log('\nStaged files:\n' + status.split('\n').filter(l => l.startsWith('M') || l.startsWith('A')).join('\n'));

// Commit
execSync('git commit -m "fix: EN card ID lowercase, JP card zero-padding, JP set 404, metadataBase"', { cwd, stdio: 'pipe' });
console.log('\nCommitted!');

// Push
try {
  const result = execSync('git push origin master', { cwd, stdio: 'pipe' }).toString();
  console.log('Pushed!', result);
} catch(e) {
  console.log('Push failed:', e.stderr?.toString() || e.message);
}