const fs = require('fs');
const path = 'C:/Users/suwij/.openclaw/workspace/tcg-vault/src/app/login/page.tsx';
let c = fs.readFileSync(path, 'utf8');

// Fix broken className lines: disabled:opacity-5 (should be 50) and missing closing quote
c = c.replace(
  /className="w-full py-3 bg-\[#6366f1\] text-white font-bold rounded-xl hover:bg-\[#4f46e5\] transition-all disabled:opacity-5\n\s*>/g,
  'className="w-full py-3 bg-[#6366f1] text-white font-semibold rounded-xl hover:bg-[#4f46e5] transition-all disabled:opacity-50"\n          >'
);

fs.writeFileSync(path, c, 'utf8');
console.log('Fixed login/page.tsx');