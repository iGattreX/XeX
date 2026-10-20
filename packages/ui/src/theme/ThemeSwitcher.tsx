import clsx from 'clsx'
import { CheckIcon } from '@heroicons/react/24/solid'
import { useTheme } from './ThemeContext'
import { ModeToggle } from './ModeToggle'
import { ThemeSelect } from './ThemeSelect'
import { radioGroupKeyDown } from '../components/keyboard'

interface ThemeSwitcherProps {
  /** `swatches` (default): a row of colour swatches. `dropdown`: a compact select of names with their colours. */
  variant?: 'swatches' | 'dropdown'
  /** Names beside the swatches (swatches variant only). */
  showLabels?: boolean
}

/**
 * Theme picker plus a separate light/dark button. Use `ThemeSelect` and `ModeToggle` directly
 * to place them independently.
 */
export function ThemeSwitcher({ variant = 'swatches', showLabels = false }: ThemeSwitcherProps) {
  const { theme, themes, setThemeId } = useTheme()

  if (variant === 'dropdown') {
    return (
      <div className="flex items-center gap-2">
        <ThemeSelect />
        <ModeToggle />
      </div>
    )
  }

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
      <ModeToggle showLabel />
    </div>
  )
}
