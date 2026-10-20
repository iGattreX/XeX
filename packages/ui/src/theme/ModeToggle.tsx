import clsx from 'clsx'
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid'
import { useTheme } from './ThemeContext'

/** A separate button that flips between light and dark mode. Icon only by default. */
export function ModeToggle({ showLabel = false, className }: { showLabel?: boolean; className?: string }) {
  const { mode, toggleMode } = useTheme()
  const next = mode === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={clsx(
        'flex items-center gap-1.5 rounded-lg border border-gray-300 bg-surface text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
        showLabel ? 'px-2.5 py-1.5' : 'p-2',
        className,
      )}
    >
      {mode === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
      {showLabel && (mode === 'dark' ? 'Light' : 'Dark')}
    </button>
  )
}
