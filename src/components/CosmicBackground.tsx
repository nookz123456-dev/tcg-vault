// Animated cosmic backdrop: drifting nebula clouds + parallax starfield.
// Pure CSS (see globals.css .cosmic-bg), respects prefers-reduced-motion.
export default function CosmicBackground() {
  return (
    <div className="cosmic-bg" aria-hidden="true">
      <span className="neb neb-a" />
      <span className="neb neb-b" />
      <span className="neb neb-c" />
      <span className="stars" />
      <span className="stars2" />
    </div>
  )
}
