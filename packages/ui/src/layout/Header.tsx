import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Bars3Icon } from '@heroicons/react/24/outline'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  /** Opens the navigation drawer. */
  onMenu?: () => void
  /**
   * Show the menu button at every width. By default it only shows below lg, where the navigation is a
   * drawer; set this when the user has collapsed the navigation on a wide screen.
   */
  menuAlwaysVisible?: boolean
  /** `comfortable` (default) or `compact`: less padding, a smaller title and a one-line subtitle. */
  density?: 'comfortable' | 'compact'
}

const styles = {
  comfortable: {
    bar: 'gap-3 py-4',
    left: 'gap-3',
    menu: 'p-1.5',
    menuIcon: 'h-6 w-6',
    title: 'text-xl',
    subtitle: 'text-sm',
  },
  compact: {
    bar: 'gap-x-3 gap-y-1.5 py-2',
    left: 'gap-2.5',
    menu: 'p-1',
    menuIcon: 'h-5 w-5',
    title: 'text-lg leading-6',
    subtitle: 'truncate text-xs leading-4',
  },
} as const

export function Header({ title, subtitle, actions, onMenu, menuAlwaysVisible = false, density = 'comfortable' }: HeaderProps) {
  const d = styles[density]
  return (
    <header
      data-density={density}
      className={clsx('sticky top-0 z-30 flex flex-wrap items-center justify-between border-b border-gray-200 bg-surface px-4 shadow-sm sm:px-6', d.bar)}
    >
      <div className={clsx('flex min-w-0 items-center', d.left)}>
        {onMenu && (
          <button
            type="button"
            onClick={onMenu}
            aria-label="Open navigation"
            className={clsx(
              'rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
              d.menu,
              !menuAlwaysVisible && 'lg:hidden',
            )}
          >
            <Bars3Icon className={d.menuIcon} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className={clsx('truncate font-bold text-gray-900', d.title)}>{title}</h1>
          {subtitle && <p className={clsx('text-gray-500', d.subtitle)}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
