'use client'

import { useRef } from 'react'

// Pointer-driven 3D tilt + holographic shine. Pure CSS transforms (GPU-fast),
// no WebGL. Wrap a card image; pass holo for the rainbow sheen on rare cards.
export default function TiltCard({
  children, className = '', holo = false, max = 16,
}: {
  children: React.ReactNode
  className?: string
  holo?: boolean
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width // 0..1
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', `${(0.5 - py) * max}deg`)
    el.style.setProperty('--ry', `${(px - 0.5) * max}deg`)
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
    el.style.setProperty('--s', '1.05')
  }

  const onLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--s', '1')
  }

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={`tilt3d ${className}`}>
      {children}
      <span className="tilt3d__glare" />
      {holo && <span className="tilt3d__holo" />}
    </div>
  )
}
