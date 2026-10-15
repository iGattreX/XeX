import type { ReactNode } from 'react'
import { Spinner } from './Spinner'

export interface LoadingOverlayProps {
  loading: boolean
  /** Shown beside the spinner and used as its accessible name. */
  label?: string
  children: ReactNode
  className?: string
}

/** Dims and blocks its content while loading, with a centred spinner. Content stays mounted. */
export function LoadingOverlay({ loading, label = 'Loading…', children, className }: LoadingOverlayProps) {
  return (
    <div className={className ? `relative ${className}` : 'relative'} aria-busy={loading || undefined}>
      <div inert={loading || undefined}>{children}</div>
      {loading && (
        <div className="xex-overlay absolute inset-0 z-10 flex items-center justify-center gap-3 rounded-[inherit] backdrop-blur-[1px]">
          <Spinner size="lg" label={label} className="text-accent" />
          <span className="text-sm font-medium text-gray-700" aria-hidden="true">
            {label}
          </span>
        </div>
      )}
    </div>
  )
}
