export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace'

export interface FontChoice {
  /** Font family name (also the unique id), e.g. "DM Sans". */
  family: string
  category: FontCategory
  /** Available static weights, used to build the Google Fonts URL. */
  weights?: number[]
  /** Custom CSS stack for non-web fonts (e.g. the system font). */
  stack?: string
  /** The app already ships this font (self-hosted); never request it from Google Fonts. */
  bundled?: boolean
}

/** Inter is the design system's default typeface. Apps are expected to self-host it (e.g. @fontsource/inter). */
export const DEFAULT_FONT: FontChoice = { family: 'Inter', category: 'sans-serif', weights: [400, 500, 600, 700], bundled: true }

export const SYSTEM_FONT: FontChoice = {
  family: 'System UI',
  category: 'sans-serif',
  stack: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
}

export const FONT_CATEGORIES: { value: FontCategory; label: string }[] = [
  { value: 'sans-serif', label: 'Sans serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'display', label: 'Display' },
  { value: 'handwriting', label: 'Handwriting' },
  { value: 'monospace', label: 'Monospace' },
]

const FALLBACK: Record<FontCategory, string> = {
  'sans-serif': 'ui-sans-serif, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, serif',
  display: 'ui-sans-serif, system-ui, sans-serif',
  handwriting: 'cursive',
  monospace: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}

export function fontStack(f: FontChoice): string {
  return f.stack ?? `'${f.family}', ${FALLBACK[f.category] ?? FALLBACK['sans-serif']}`
}

/** True for fonts that must not be fetched from Google Fonts (custom stacks and bundled fonts such as Inter). */
export const isLocalFont = (f: FontChoice): boolean => Boolean(f.stack || f.bundled || f.family === DEFAULT_FONT.family)

const WANTED_WEIGHTS = [400, 500, 600, 700]

const requested = new Set<string>()
let previewBatch = 0

/**
 * Loads the regular weight of many families with ONE Google Fonts stylesheet request, so
 * list rows can be drawn in their own typeface. Skips local fonts and families already requested.
 * Only called by the optional font picker; nothing in the core talks to Google.
 */
export function loadFontPreviews(list: FontChoice[]): void {
  if (typeof document === 'undefined') return
  const fresh = list.filter((f) => !isLocalFont(f) && !requested.has(f.family))
  if (fresh.length === 0) return
  const params = fresh.map((f) => {
    const w = f.weights?.includes(400) ? 400 : (f.weights?.[0] ?? 400)
    requested.add(f.family)
    return `family=${f.family.replace(/ /g, '+')}:wght@${w}`
  })
  const link = document.createElement('link')
  link.id = `gf-preview-${previewBatch++}`
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`
  document.head.appendChild(link)
}

/**
 * Injects (once) the Google Fonts stylesheet for a family. No-op for local fonts, so an app that
 * never lets users pick a Google font makes no external requests.
 */
export function loadGoogleFont(f: FontChoice): void {
  if (isLocalFont(f) || typeof document === 'undefined') return
  const id = `gf-${f.family.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const available = f.weights?.length ? f.weights : [400]
  let weights = WANTED_WEIGHTS.filter((w) => available.includes(w))
  if (weights.length === 0) weights = [available[0]]
  const spec = `${f.family.replace(/ /g, '+')}:wght@${weights.join(';')}`
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`
  document.head.appendChild(link)
}
