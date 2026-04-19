const fs = require('fs');
const path = require('path');

const fp = path.join(__dirname, 'src/app/page.tsx');
let content = fs.readFileSync(fp, 'utf8');

// 1. Title: text-5xl → text-3xl on mobile
content = content.replace(
  /text-5xl md:text-7xl/g,
  'text-3xl sm:text-4xl md:text-7xl'
);

// 2. Subtitle: text-lg → text-base on mobile
content = content.replace(
  /text-lg md:text-xl text-\[#5c6078\] max-w-2xl mx-auto mb-12/g,
  'text-base md:text-xl text-[#5c6078] max-w-2xl mx-auto mb-8 sm:mb-12'
);

// 3. CTA buttons gap & margin responsive
content = content.replace(
  /flex flex-col sm:flex-row gap-4 justify-center mb-16/g,
  'flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-16'
);

// 4. Primary CTA button responsive
content = content.replace(
  /group px-8 py-4 bg-\[#6366f1\] text-white font-semibold rounded-xl hover:bg-\[#4f46e5\] transition-all text-lg/g,
  'group px-6 py-3.5 sm:px-8 sm:py-4 bg-[#6366f1] text-white font-semibold rounded-xl hover:bg-[#4f46e5] transition-all text-base sm:text-lg'
);

// 5. Secondary CTA button responsive
content = content.replace(
  /px-8 py-4 bg-white border border-\[#e8eaf0\] text-\[#5c6078\] font-semibold rounded-xl hover:text-\[#6366f1\] hover:border-\[#6366f1\]\/30 transition-all text-lg/g,
  'px-6 py-3.5 sm:px-8 sm:py-4 bg-white border border-[#e8eaf0] text-[#5c6078] font-semibold rounded-xl hover:text-[#6366f1] hover:border-[#6366f1]/30 transition-all text-base sm:text-lg'
);

// 6. Stats gap responsive
content = content.replace(
  /flex items-center justify-center gap-8 md:gap-12 text-center/g,
  'flex items-center justify-center gap-6 sm:gap-8 md:gap-12 text-center'
);

// 7. Stats numbers responsive
content = content.replace(
  /text-3xl font-extrabold text-\[#1e2235\]/g,
  'text-2xl sm:text-3xl font-extrabold text-[#1e2235]'
);

// 8. Stats labels responsive
content = content.replace(
  /text-sm text-\[#8b8fa6\] mt-1/g,
  'text-xs sm:text-sm text-[#8b8fa6] mt-1'
);

// 9. Hero section padding responsive
content = content.replace(
  /pt-8 pb-28/g,
  'pt-6 pb-16 sm:pt-8 sm:pb-28'
);

// 10. Features section padding responsive
content = content.replace(
  /py-24/g,
  'py-16 sm:py-24'
);

// 11. Feature card padding responsive
content = content.replace(
  /rounded-2xl p-8 hover:shadow-md/g,
  'rounded-2xl p-5 sm:p-8 hover:shadow-md'
);

fs.writeFileSync(fp, content, 'utf8');
console.log('✅ Homepage responsive fixes applied');