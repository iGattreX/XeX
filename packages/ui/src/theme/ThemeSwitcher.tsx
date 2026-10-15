import clsx from 'clsx'
import { CheckIcon, MoonIcon, SunIcon } from '@heroicons/react/24/solid'
import { useTheme } from './ThemeContext'
import { radioGroupKeyDown } from '../components/keyboard'

/** Swatch per theme + light/dark toggle. */
export function ThemeSwitcher({ showLabels = false }: { showLabels?: boolean }) {
  const { theme, themes, setThemeId, mode, toggleMode } = useTheme()
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Color theme" onKeyDown={radioGroupKeyDown}>
        {themes.map((t) => {
          const selected = t.id === theme.id
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              title={t.name}
              onClick={() => setThemeId(t.id)}
              className={clsx(
                'flex items-center gap-2 rounded-full border p-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                showLabels && 'pr-3',
                selected ? 'border-gray-400' : 'border-transparent hover:border-gray-300',
              )}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                style={{ background: `linear-gradient(135deg, ${t.shades[400]}, ${t.shades[700]})` }}
              >
                {selected && <CheckIcon className="h-4 w-4" />}
              </span>
              {showLabels && <span className="text-sm font-medium text-gray-700">{t.name}</span>}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={toggleMode}
        aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        {mode === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
        {mode === 'dark' ? 'Light' : 'Dark'}
      </button>
    </div>
  )
}
