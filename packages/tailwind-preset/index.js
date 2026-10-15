/**
 * XeX Tailwind preset (Tailwind v3).
 *
 *   // tailwind.config.js
 *   import xex from '@xex/tailwind-preset'
 *   export default {
 *     presets: [xex],
 *     content: ['./index.html', './src/**\/*.{ts,tsx}', './node_modules/@xex/ui/dist/**\/*.js'],
 *   }
 *
 * Every colour below is a CSS variable defined in @xex/tokens/styles.css (light values, with dark
 * values under html[data-mode="dark"]). That is what makes theming and dark mode work without a
 * rebuild and without per-class overrides:
 *
 *   brand-50…900   the active theme's scale, written onto <html> by <ThemeProvider>
 *   gray-50…900    remapped, so gray-* utilities flip automatically in dark mode
 *   canvas         page background            surface   cards, panels, inputs
 *   accent         brand-coloured text        accent-strong, accent-soft, accent-softer, accent-line
 *   danger | success | warning | info | purple
 *                  status tones: DEFAULT (solid), -soft (tinted bg), -line (border), -ink (text)
 */
const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

const scale = (name) => Object.fromEntries(steps.map((s) => [s, `var(--${name}-${s})`]))
const tone = (name) => ({
  DEFAULT: `var(--${name})`,
  soft: `var(--${name}-soft)`,
  line: `var(--${name}-line)`,
  ink: `var(--${name}-ink)`,
})

/** @type {Partial<import('tailwindcss').Config>} */
const preset = {
  darkMode: ['class', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: scale('brand'),
        gray: scale('gray'),
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        accent: {
          DEFAULT: 'var(--accent)',
          strong: 'var(--accent-strong)',
          soft: 'var(--accent-soft)',
          softer: 'var(--accent-softer)',
          line: 'var(--accent-line)',
        },
        danger: tone('danger'),
        success: tone('success'),
        warning: tone('warning'),
        info: tone('info'),
        purple: tone('purple'),
      },
      fontFamily: {
        // --font-sans is set at runtime by <ThemeProvider> (the user's chosen font).
        sans: ['var(--font-sans)', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'Cambria', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
}

export default preset
