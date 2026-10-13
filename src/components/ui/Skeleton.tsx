import clsx from 'clsx'

export interface SkeletonProps {
  shape?: 'text' | 'circle' | 'rect'
  /** Size via Tailwind classes, e.g. "h-10 w-10". Text defaults to a full-width line. */
  className?: string
}

/** Grey placeholder block that pulses. Decorative: put `aria-busy` on the region being loaded. */
export function Skeleton({ shape = 'rect', className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'block animate-pulse bg-gray-200 motion-reduce:animate-none',
        shape === 'circle' ? 'rounded-full' : shape === 'text' ? 'h-3 w-full rounded' : 'rounded-lg',
        className,
      )}
    />
  )
}

/** A paragraph of skeleton lines; the last one is shorter. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} shape="text" className={i === lines - 1 && lines > 1 ? 'w-2/3' : undefined} />
      ))}
    </div>
  )
}
