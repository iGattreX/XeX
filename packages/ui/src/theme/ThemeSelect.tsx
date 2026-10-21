import { useMemo } from 'react'
import type { Theme } from '@xex/tokens'
import { useTheme } from './ThemeContext'
import { Combobox } from '../components/Combobox'

/** The theme's swatch, the same gradient the swatch picker uses, beside its name. */
function Dot({ theme }: { theme: Theme }) {
  return (
    <span
      className="h-4 w-4 shrink-0 rounded-full"
      style={{ background: `linear-gradient(135deg, ${theme.shades[400]}, ${theme.shades[700]})` }}
      aria-hidden="true"
    />
  )
}

/**
 * Dropdown to pick the colour theme: each option shows the theme's gradient swatch and its name.
 * A compact `Combobox`, without a search box (there are only a handful of themes).
 */
export function ThemeSelect({ className, align = 'right' }: { className?: string; align?: 'left' | 'right' }) {
  const { theme, themes, setThemeId } = useTheme()
  const options = useMemo(() => themes.map((t) => ({ value: t.id, label: t.name, icon: <Dot theme={t} /> })), [themes])

  return (
    <Combobox
      className={className}
      options={options}
      value={theme.id}
      onChange={setThemeId}
      aria-label={`Color theme: ${theme.name}`}
      searchable={false}
      align={align}
      triggerClassName="w-44 px-2.5 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
      popupClassName="w-56 max-h-[min(26rem,70vh)]"
    />
  )
}
