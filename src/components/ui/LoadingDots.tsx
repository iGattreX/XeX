/** Three staggered fading dots; inherits currentColor. Animation lives in index.css. */
export function LoadingDots({ className }: { className?: string }) {
  return (
    <span role="status" aria-label="Loading" className={`xex-dots ${className ?? ''}`}>
      <i />
      <i />
      <i />
    </span>
  )
}
