const fs = require('fs');
const path = require('path');

// Fix Navbar for mobile - make sure logo/name doesn't overflow
const navbarPath = path.join(__dirname, 'src/components/Navbar.tsx');
let navbar = fs.readFileSync(navbarPath, 'utf8');

// The logo is already w-8 h-8 which is fine for mobile
// The text is hidden sm:block which is correct
console.log('✅ Navbar already mobile-friendly');

// Fix community CTA section for mobile
const pagePath = path.join(__dirname, 'src/app/page.tsx');
let page = fs.readFileSync(pagePath, 'utf8');

// Community section - make cards and text responsive
page = page.replace(
  /text-3xl md:text-4xl font-extrabold text-\[#1e2235\] mb-4 tracking-tight(?!\s*\{)/g,
  'text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1e2235] mb-3 sm:mb-4 tracking-tight'
);

// How it works title responsive
page = page.replace(
  /text-3xl md:text-4xl font-extrabold text-\[#1e2235\] mb-4 tracking-tight(?!\s*\{)/g,
  'text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1e2235] mb-4 tracking-tight'
);

// Features title responsive
// Check if already done
if (!page.includes('text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1e2235] mb-4 tracking-tight')) {
  page = page.replace(
    /text-3xl md:text-4xl font-extrabold text-\[#1e2235\] mb-4 tracking-tight/g,
    'text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1e2235] mb-4 tracking-tight'
  );
}

// Footer responsive
page = page.replace(
  /flex flex-col md:flex-row items-center justify-between gap-4/g,
  'flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4'
);

fs.writeFileSync(pagePath, page, 'utf8');
console.log('✅ Additional mobile fixes applied');