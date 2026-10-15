import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_FONT,
  DEFAULT_THEME_ID,
  SHADE_STEPS,
  fontStack,
  loadGoogleFont,
  themes as defaultThemes,
  type FontChoice,
  type Theme,
} from '@xex/tokens'

export type ColorMode = 'light' | 'dark'

export interface ThemeContextValue {
  theme: Theme
  themes: Theme[]
  setThemeId: (id: string) => void
  mode: ColorMode
  setMode: (mode: ColorMode) => void
  toggleMode: () => void
  font: FontChoice
  /** Most recently used fonts, newest first (max 5). */
  recentFonts: FontChoice[]
  setFont: (font: FontChoice) => void
}

export interface ThemeProviderProps {
  children: ReactNode
  /**
   * Prefix for the localStorage keys (`<prefix>-theme`, `<prefix>-mode`, `<prefix>-font`, …).
   * Give every app its own prefix: apps on one domain would otherwise overwrite each other's choices.
   */
  storagePrefix?: string
  /** Themes to offer. Defaults to the built-in XeX presets. */
  themes?: Theme[]
  /** Theme used until the user picks one. */
  defaultThemeId?: string
  /** Font used until the user picks one. */
  defaultFont?: FontChoice
}

const MAX_RECENT_FONTS = 5

const ThemeContext = createContext<ThemeContextValue | null>(null)

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable — theme still works for this session */
  }
}

function readJson<T>(key: string, guard: (v: unknown) => v is T): T | null {
  try {
    const raw = read(key)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return guard(parsed) ? parsed : null
  } catch {
    return null
  }
}

const isFont = (v: unknown): v is FontChoice =>
  typeof v === 'object' && v !== null && typeof (v as FontChoice).family === 'string' && typeof (v as FontChoice).category === 'string'

export function ThemeProvider({
  children,
  storagePrefix = 'xex',
  themes = defaultThemes,
  defaultThemeId = DEFAULT_THEME_ID,
  defaultFont = DEFAULT_FONT,
}: ThemeProviderProps) {
  const keys = useMemo(
    () => ({
      theme: `${storagePrefix}-theme`,
      mode: `${storagePrefix}-mode`,
      font: `${storagePrefix}-font`,
      recent: `${storagePrefix}-recent-fonts`,
    }),
    [storagePrefix],
  )

  const findTheme = useCallback((id: string | null | undefined): Theme => themes.find((t) => t.id === id) ?? themes.find((t) => t.id === defaultThemeId) ?? themes[0], [themes, defaultThemeId])

  const [themeId, setThemeIdState] = useState(() => findTheme(read(keys.theme)).id)
  const [mode, setModeState] = useState<ColorMode>(() => {
    const saved = read(keys.mode)
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [font, setFontState] = useState<FontChoice>(() => readJson<FontChoice>(keys.font, isFont) ?? defaultFont)
  const [recentFonts, setRecentFonts] = useState<FontChoice[]>(() => {
    const saved = readJson<FontChoice[]>(keys.recent, (v): v is FontChoice[] => Array.isArray(v) && v.every(isFont))
    return (saved ?? [defaultFont]).slice(0, MAX_RECENT_FONTS)
  })

  const theme = useMemo(() => findTheme(themeId), [findTheme, themeId])

  useEffect(() => {
    loadGoogleFont(font)
    document.documentElement.style.setProperty('--font-sans', fontStack(font))
  }, [font])

  // Recent chips are drawn in their own typeface, so make sure each is loaded.
  useEffect(() => recentFonts.forEach(loadGoogleFont), [recentFonts])

  const setFont = useCallback(
    (next: FontChoice) => {
      setFontState(next)
      write(keys.font, JSON.stringify(next))
      setRecentFonts((prev) => {
        const list = [next, ...prev.filter((f) => f.family !== next.family)].slice(0, MAX_RECENT_FONTS)
        write(keys.recent, JSON.stringify(list))
        return list
      })
    },
    [keys],
  )

  // Write each shade as --brand-<step> on <html>.
  useEffect(() => {
    const root = document.documentElement
    for (const step of SHADE_STEPS) root.style.setProperty(`--brand-${step}`, theme.shades[step])
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.mode = mode
    root.classList.toggle('dark', mode === 'dark')
    root.style.colorScheme = mode
  }, [mode])

  const setThemeId = useCallback(
    (id: string) => {
      const next = findTheme(id).id
      setThemeIdState(next)
      write(keys.theme, next)
    },
    [findTheme, keys],
  )

  const setMode = useCallback(
    (next: ColorMode) => {
      setModeState(next)
      write(keys.mode, next)
    },
    [keys],
  )

  const toggleMode = useCallback(() => setMode(mode === 'dark' ? 'light' : 'dark'), [mode, setMode])

  const value = useMemo(
    () => ({ theme, themes, setThemeId, mode, setMode, toggleMode, font, recentFonts, setFont }),
    [theme, themes, setThemeId, mode, setMode, toggleMode, font, recentFonts, setFont],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
