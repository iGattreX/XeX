export const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const
export type ShadeStep = (typeof SHADE_STEPS)[number]

export interface Theme {
  id: string
  name: string
  /** Tailwind-style 50–900 steps, hex strings. */
  shades: Record<ShadeStep, string>
}

/**
 * Ordered around the colour wheel (blue → violet → pink/red → orange → yellow →
 * green → teal), then a neutral. Hue of the 600 step is noted for each.
 *
 * Gold, Lime and Teal are light hues, so their 500–900 steps are taken one
 * Tailwind step darker; that keeps white text on bg-brand-600 at ≥ 4.5:1.
 */
export const themes: Theme[] = [
  {
    id: 'classic', // blue ~221°
    name: 'Classic',
    shades: {
      50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
      500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a',
    },
  },
  {
    id: 'midnight', // indigo ~243°
    name: 'Midnight',
    shades: {
      50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8',
      500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81',
    },
  },
  {
    id: 'royal', // violet ~262°
    name: 'Royal',
    shades: {
      50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa',
      500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95',
    },
  },
  {
    id: 'orchid', // fuchsia ~293°
    name: 'Orchid',
    shades: {
      50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc', 400: '#e879f9',
      500: '#d946ef', 600: '#c026d3', 700: '#a21caf', 800: '#86198f', 900: '#701a75',
    },
  },
  {
    id: 'crimson', // rose ~347°
    name: 'Crimson',
    shades: {
      50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185',
      500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337',
    },
  },
  {
    id: 'sunset', // orange ~21°
    name: 'Sunset',
    shades: {
      50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
      500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12',
    },
  },
  {
    id: 'gold', // yellow ~40°
    name: 'Gold',
    shades: {
      50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047', 400: '#facc15',
      500: '#ca8a04', 600: '#a16207', 700: '#854d0e', 800: '#713f12', 900: '#422006',
    },
  },
  {
    id: 'lime', // lime ~85°
    name: 'Lime',
    shades: {
      50: '#f7fee7', 100: '#ecfccb', 200: '#d9f99d', 300: '#bef264', 400: '#a3e635',
      500: '#65a30d', 600: '#4d7c0f', 700: '#3f6212', 800: '#365314', 900: '#1a2e05',
    },
  },
  {
    id: 'forest', // green ~142°
    name: 'Forest',
    shades: {
      50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
      500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d',
    },
  },
  {
    id: 'teal', // teal ~175°
    name: 'Teal',
    shades: {
      50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf',
      500: '#0d9488', 600: '#0f766e', 700: '#115e59', 800: '#134e4a', 900: '#042f2e',
    },
  },
  {
    id: 'graphite', // neutral slate
    name: 'Graphite',
    shades: {
      50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8',
      500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a',
    },
  },
]

export const DEFAULT_THEME_ID = 'classic'

export function getTheme(id: string | null | undefined): Theme {
  return themes.find((t) => t.id === id) ?? themes.find((t) => t.id === DEFAULT_THEME_ID)!
}
