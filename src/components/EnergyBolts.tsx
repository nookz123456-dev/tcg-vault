// Decorative jagged energy bolts radiating outward — the accent flanking
// featured content, à la the Pokémon expansion page (in our cosmic palette).
export default function EnergyBolts({ side }: { side: 'left' | 'right' }) {
  const bolts = [
    'M0,60 L34,52 L22,64 L60,58',
    'M2,90 L40,86 L28,98 L72,92',
    'M0,120 L44,120 L30,132 L78,126',
    'M2,150 L40,156 L26,168 L70,164',
    'M0,182 L34,192 L22,204 L58,200',
  ]
  return (
    <svg
      viewBox="0 0 80 240"
      aria-hidden="true"
      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 h-[80%] w-24 opacity-70 hidden lg:block ${
        side === 'left' ? 'left-0' : 'right-0 -scale-x-100'
      }`}
    >
      <defs>
        <linearGradient id={`bolt-${side}`} x1="0" y1="0" x2="80" y2="0">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#a855f7" />
          <stop offset="1" stopColor="#ff2b39" />
        </linearGradient>
      </defs>
      {bolts.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={`url(#bolt-${side})`} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  )
}
