import clsx from 'clsx'

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizes: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

export interface SpinnerProps {
  size?: SpinnerSize
  /** Accessible name; ignored when `decorative`. */
  label?: string
  /** Hide from assistive tech (use when the surrounding text already says "loading"). */
  decorative?: boolean
  className?: string
}

/** Rotating ring. Inherits currentColor, so colour it with a text-* class. */
export function Spinner({ size = 'sm', label = 'Loading', decorative = false, className }: SpinnerProps) {
  return (
    <svg
      className={clsx(sizes[size], 'animate-spin motion-reduce:animate-[spin_2s_linear_infinite]', className)}
      viewBox="0 0 24 24"
      fill="none"
      {...(decorative ? { 'aria-hidden': true } : { role: 'status', 'aria-label': label })}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-90" />
    </svg>
  )
}
