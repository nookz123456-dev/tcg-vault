const https = require('https');

// Try to find the password by checking our daily logs
const fs = require('fs');

// Read daily memory files for any mention of password
const files = [
  'C:\\Users\\suwij\\.openclaw\\workspace\\memory\\2026-04-10.md',
  'C:\\Users\\suwij\\.openclaw\\workspace\\memory\\2026-04-11.md',
  'C:\\Users\\suwij\\.openclaw\\workspace\\memory\\2026-04-12.md',
];

for (const f of files) {
  try {
    const content = fs.readFileSync(f, 'utf8');
    // Search for password-related content
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('password') || line.includes('sora-trader') || line.includes('register') || line.includes('selfregister')) {
        console.log(`[${f}] Line ${i+1}: ${lines[i].trim()}`);
        // Print surrounding context
        if (i > 0) console.log(`  prev: ${lines[i-1].trim()}`);
        if (i < lines.length - 1) console.log(`  next: ${lines[i+1].trim()}`);
      }
    }
  } catch (e) {}
}