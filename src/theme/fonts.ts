import { useEffect, useState } from 'react'

export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace'

export interface FontChoice {
  /** Google Fonts family name (also the unique id), e.g. "DM Sans". */
  family: string
  category: FontCategory
  /** Available static weights, used to build the Google Fonts URL. */
  weights?: number[]
  /** Custom CSS stack for non-Google entries (e.g. the system font). */
  stack?: string
}

export const DEFAULT_FONT: FontChoice = { family: 'Inter', category: 'sans-serif', weights: [400, 500, 600, 700] }
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

const WANTED_WEIGHTS = [400, 500, 600, 700]

const requested = new Set<string>()
let previewBatch = 0

/**
 * Loads the regular weight of many families with ONE stylesheet request, so
 * list rows can be drawn in their own typeface. Skips families already requested.
 */
export function loadFontPreviews(list: FontChoice[]): void {
  if (typeof document === 'undefined') return
  const fresh = list.filter((f) => !f.stack && !requested.has(f.family))
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

/** Injects (once) the Google Fonts stylesheet for a family. No-op for custom stacks. */
export function loadGoogleFont(f: FontChoice): void {
  if (f.stack || typeof document === 'undefined') return
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

// --- Catalog (every Google Font), fetched lazily from Fontsource's keyless API ---

interface FontsourceEntry {
  family: string
  category: string
  weights: number[]
}

let catalogCache: FontChoice[] | null = null
let catalogPromise: Promise<FontChoice[]> | null = null

export function fetchFontCatalog(): Promise<FontChoice[]> {
  if (catalogCache) return Promise.resolve(catalogCache)
  catalogPromise ??= fetch('https://api.fontsource.org/v1/fonts?type=google')
    .then((r) => {
      if (!r.ok) throw new Error(`Font catalog request failed (${r.status})`)
      return r.json() as Promise<FontsourceEntry[]>
    })
    .then((list) => {
      catalogCache = list
        .filter((e) => e.category in FALLBACK)
        .map((e) => ({ family: e.family, category: e.category as FontCategory, weights: e.weights }))
        .sort((a, b) => a.family.localeCompare(b.family))
      return catalogCache
    })
    .catch((err) => {
      catalogPromise = null // allow retry
      throw err
    })
  return catalogPromise
}

export interface CatalogState {
  fonts: FontChoice[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  retry: () => void
}

/** Loads the catalog when `enabled` first becomes true. */
export function useFontCatalog(enabled: boolean): CatalogState {
  const [fonts, setFonts] = useState<FontChoice[]>(catalogCache ?? [])
  const [status, setStatus] = useState<CatalogState['status']>(catalogCache ? 'ready' : 'idle')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled || status === 'ready') return
    let live = true
    setStatus('loading')
    fetchFontCatalog()
      .then((list) => {
        if (!live) return
        setFonts(list)
        setStatus('ready')
      })
      .catch(() => live && setStatus('error'))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, attempt])

  return { fonts, status, retry: () => setAttempt((n) => n + 1) }
}
