import clsx from 'clsx'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizes: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-14 w-14 text-lg',
}

/** Rotating palette, deliberately independent of the brand theme. */
export const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function colorFor(seed: string): string {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export interface AvatarProps {
  name: string
  size?: AvatarSize
  /** Any hex; defaults to a stable color derived from the name. */
  color?: string
  className?: string
}

export function Avatar({ name, size = 'md', color, className }: AvatarProps) {
  return (
    <span
      title={name}
      style={{ backgroundColor: color ?? colorFor(name) }}
      className={clsx('inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold text-white', sizes[size], className)}
    >
      {initialsOf(name)}
    </span>
  )
}
