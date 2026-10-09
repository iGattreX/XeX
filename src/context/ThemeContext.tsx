import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_THEME_ID, SHADE_STEPS, getTheme, themes, type Theme } from '../theme/themes'
import { DEFAULT_FONT, fontStack, loadGoogleFont, type FontChoice } from '../theme/fonts'

export type ColorMode = 'light' | 'dark'

interface ThemeContextValue {
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

const THEME_KEY = 'xex-theme'
const FONT_KEY = 'xex-font'
const RECENT_FONTS_KEY = 'xex-recent-fonts'
const MAX_RECENT_FONTS = 5
const MODE_KEY = 'xex-mode'

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

function initialMode(): ColorMode {
  const saved = read(MODE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState(() => read(THEME_KEY) ?? DEFAULT_THEME_ID)
  const [mode, setModeState] = useState<ColorMode>(initialMode)

  const [font, setFontState] = useState<FontChoice>(() => readJson<FontChoice>(FONT_KEY, isFont) ?? DEFAULT_FONT)
  const [recentFonts, setRecentFonts] = useState<FontChoice[]>(() => {
    const saved = readJson<FontChoice[]>(RECENT_FONTS_KEY, (v): v is FontChoice[] => Array.isArray(v) && v.every(isFont))
    return (saved ?? [DEFAULT_FONT]).slice(0, MAX_RECENT_FONTS)
  })

  const theme = useMemo(() => getTheme(themeId), [themeId])

  useEffect(() => {
    loadGoogleFont(font)
    document.documentElement.style.setProperty('--font-sans', fontStack(font))
  }, [font])

  // Recent chips are drawn in their own typeface, so make sure each is loaded.
  useEffect(() => recentFonts.forEach(loadGoogleFont), [recentFonts])

  const setFont = useCallback((next: FontChoice) => {
    setFontState(next)
    write(FONT_KEY, JSON.stringify(next))
    setRecentFonts((prev) => {
      const list = [next, ...prev.filter((f) => f.family !== next.family)].slice(0, MAX_RECENT_FONTS)
      write(RECENT_FONTS_KEY, JSON.stringify(list))
      return list
    })
  }, [])

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

  const setThemeId = useCallback((id: string) => {
    const next = getTheme(id).id
    setThemeIdState(next)
    write(THEME_KEY, next)
  }, [])

  const setMode = useCallback((next: ColorMode) => {
    setModeState(next)
    write(MODE_KEY, next)
  }, [])

  const toggleMode = useCallback(() => setMode(mode === 'dark' ? 'light' : 'dark'), [mode, setMode])

  const value = useMemo(
    () => ({ theme, themes, setThemeId, mode, setMode, toggleMode, font, recentFonts, setFont }),
    [theme, setThemeId, mode, setMode, toggleMode, font, recentFonts, setFont],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
