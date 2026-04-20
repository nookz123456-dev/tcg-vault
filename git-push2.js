const { execSync } = require('child_process');
const cwd = 'C:\\Users\\suwij\\.openclaw\\workspace\\tcg-vault';

// Reset and selectively add only the fixed source files
try {
  execSync('git reset HEAD', { cwd, stdio: 'pipe' });
  
  const files = [
    'src/app/api/cards/pokemon/[id]/route.ts',
    'src/app/api/cards/pokemon-jp/[id]/route.ts',
    'src/app/api/sets/pokemon-jp/[setId]/route.ts',
    'src/app/layout.tsx',
  ];
  
  for (const f of files) {
    try {
      execSync(`git add "${f}"`, { cwd, stdio: 'pipe' });
      console.log(`Added: ${f}`);
    } catch(e) {
      console.log(`Failed: ${f} - ${e.message}`);
    }
  }
  
  execSync('git commit -m "fix: EN card ID lowercase, JP card zero-padding, JP set 404, metadataBase"', { cwd, stdio: 'pipe' });
  console.log('Committed!');
  
  execSync('git push origin master', { cwd, stdio: 'pipe' });
  console.log('Pushed!');
} catch(e) {
  console.log('Error:', e.message);
}