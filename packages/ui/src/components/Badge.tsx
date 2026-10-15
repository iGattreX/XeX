import type { ReactNode } from 'react'
import clsx from 'clsx'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gray'

const variants: Record<BadgeVariant, { pill: string; dot: string }> = {
  default: { pill: 'bg-brand-100 text-brand-700', dot: 'bg-brand-500' },
  success: { pill: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  warning: { pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  danger: { pill: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  info: { pill: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  purple: { pill: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
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
