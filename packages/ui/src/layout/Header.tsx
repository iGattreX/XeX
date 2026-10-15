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
}

export function Header({ title, subtitle, actions, onMenu, menuAlwaysVisible = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-surface px-4 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenu && (
          <button
            type="button"
            onClick={onMenu}
            aria-label="Open navigation"
            className={clsx(
              'rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
              !menuAlwaysVisible && 'lg:hidden',
            )}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
