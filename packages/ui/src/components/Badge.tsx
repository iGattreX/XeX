import type { ReactNode } from 'react'
import clsx from 'clsx'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gray'

const variants: Record<BadgeVariant, { pill: string; dot: string }> = {
  default: { pill: 'bg-accent-softer text-accent', dot: 'bg-brand-500' },
  success: { pill: 'bg-success-soft text-success-ink', dot: 'bg-success' },
  warning: { pill: 'bg-warning-soft text-warning-ink', dot: 'bg-warning' },
  danger: { pill: 'bg-danger-soft text-danger-ink', dot: 'bg-danger' },
  info: { pill: 'bg-info-soft text-info-ink', dot: 'bg-info' },
  purple: { pill: 'bg-purple-soft text-purple-ink', dot: 'bg-purple' },
  gray: { pill: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' },
}

export interface BadgeProps {
  variant?: BadgeVariant
  dot?: boolean
  className?: string
  children: ReactNode
}

export function Badge({ variant = 'default', dot = false, className, children }: BadgeProps) {
  const v = variants[variant]
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', v.pill, className)}>
      {dot && <span className={clsx('h-1.5 w-1.5 rounded-full', v.dot)} aria-hidden="true" />}
      {children}
    </span>
  )
}
