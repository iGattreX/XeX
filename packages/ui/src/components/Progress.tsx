import clsx from 'clsx'

export type ProgressTone = 'brand' | 'success' | 'warning' | 'danger'

const fills: Record<ProgressTone, string> = {
  brand: 'bg-brand-600',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

const strokes: Record<ProgressTone, string> = {
  brand: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

const heights = { sm: 'h-1', md: 'h-2', lg: 'h-3' }

export interface ProgressBarProps {
  /** 0–100. Omit for an indeterminate ("working, no idea how long") bar. */
  value?: number
  /** Accessible name (also shown above the bar when `showLabel`). */
  label: string
  showLabel?: boolean
  tone?: ProgressTone
  size?: keyof typeof heights
  className?: string
}

export function ProgressBar({ value, label, showLabel = false, tone = 'brand', size = 'md', className }: ProgressBarProps) {
  const determinate = typeof value === 'number'
  const pct = determinate ? Math.min(100, Math.max(0, value)) : 0
  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-1 flex justify-between text-xs text-gray-600">
          <span>{label}</span>
          {determinate && <span className="tabular-nums">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={determinate ? Math.round(pct) : undefined}
        className={clsx('relative w-full overflow-hidden rounded-full bg-gray-200', heights[size])}
      >
        {determinate ? (
          <div className={clsx('h-full rounded-full transition-[width] duration-300 ease-out', fills[tone])} style={{ width: `${pct}%` }} />
        ) : (
          <div className={clsx('xex-indeterminate absolute inset-y-0 w-2/5 rounded-full', fills[tone])} />
        )}
      </div>
    </div>
  )
}

export interface ProgressRingProps {
  /** 0–100. Omit for an indeterminate spinning arc. */
  value?: number
  label: string
  /** Diameter in px. */
  size?: number
  tone?: ProgressTone
  /** Show the percentage in the middle (determinate only). */
  showValue?: boolean
}

export function ProgressRing({ value, label, size = 48, tone = 'brand', showValue = true }: ProgressRingProps) {
  const determinate = typeof value === 'number'
  const pct = determinate ? Math.min(100, Math.max(0, value)) : 25
  const stroke = Math.max(3, Math.round(size / 10))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={determinate ? Math.round(pct) : undefined}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={clsx('-rotate-90', !determinate && 'animate-spin')} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="xex-ring-track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="currentColor"
          className={clsx(strokes[tone], determinate && 'transition-[stroke-dashoffset] duration-300 ease-out')}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      {determinate && showValue && size >= 40 && <span className="absolute text-xs font-semibold tabular-nums text-gray-700">{Math.round(pct)}%</span>}
    </div>
  )
}
