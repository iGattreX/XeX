import { useEffect, useState } from 'react'
import { FONT_CATEGORIES, type FontCategory, type FontChoice } from '@xex/tokens'

// Catalog of every Google Font, fetched lazily from Fontsource's keyless API.
// This file is part of the optional `@xex/ui/font-picker` entry; the core never loads it.

interface FontsourceEntry {
  family: string
  category: string
  weights: number[]
}

const KNOWN_CATEGORIES = new Set<string>(FONT_CATEGORIES.map((c) => c.value))

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
        .filter((e) => KNOWN_CATEGORIES.has(e.category))
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
