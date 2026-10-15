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
 * `brand-50` … `brand-900` resolve to CSS variables that <ThemeProvider> (from @xex/ui) writes onto
 * <html> at runtime, which is how themes switch without a rebuild.
 */
const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

const brand = Object.fromEntries(steps.map((s) => [s, `var(--brand-${s})`]))

/** @type {Partial<import('tailwindcss').Config>} */
const preset = {
  darkMode: ['class', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: { brand },
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
