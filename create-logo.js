const fs = require('fs');
const path = require('path');

// Create an SVG favicon/logo for HoloCheck
const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#a78bfa"/>
    </linearGradient>
    <linearGradient id="holo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#c084fc"/>
      <stop offset="33%" style="stop-color:#60a5fa"/>
      <stop offset="66%" style="stop-color:#34d399"/>
      <stop offset="100%" style="stop-color:#f472b6"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <!-- H letter -->
  <path d="M140 130 h40 v100 h152 v-100 h40 v252 h-40 v-112 H180 v112 h-40 z" fill="white" opacity="0.95"/>
  <!-- Holo sparkle dots -->
  <circle cx="380" cy="140" r="28" fill="url(#holo)" opacity="0.6"/>
  <circle cx="400" cy="110" r="12" fill="url(#holo)" opacity="0.4"/>
  <circle cx="350" cy="380" r="16" fill="url(#holo)" opacity="0.3"/>
  <!-- Checkmark accent -->
  <path d="M340 320 l30 40 l60 -80" fill="none" stroke="url(#holo)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
</svg>`;

// Save SVG
fs.writeFileSync(path.join(__dirname, 'public/logo.svg'), svgLogo, 'utf8');
console.log('✅ Created public/logo.svg');

// Also create a simple SVG icon for favicon (smaller, simpler)
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#a78bfa"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <path d="M140 130 h40 v100 h152 v-100 h40 v252 h-40 v-112 H180 v112 h-40 z" fill="white" opacity="0.95"/>
  <circle cx="380" cy="140" r="28" fill="white" opacity="0.4"/>
  <path d="M340 320 l30 40 l60 -80" fill="none" stroke="white" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>
</svg>`;

fs.writeFileSync(path.join(__dirname, 'public/icon.svg'), svgIcon, 'utf8');
console.log('✅ Created public/icon.svg');

console.log('Done!');