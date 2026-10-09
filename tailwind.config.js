/** @type {import('tailwindcss').Config} */
const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

// brand-50 … brand-900 -> var(--brand-50) … var(--brand-900)
// The ThemeProvider writes the real hex values onto :root at runtime.
const brand = Object.fromEntries(steps.map((s) => [s, `var(--brand-${s})`]))

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-mode="dark"]'],
  theme: {
    extend: {
      colors: { brand },
      fontFamily: {
        // --font-sans is set at runtime by the ThemeProvider (see src/theme/fonts.ts).
        sans: ['var(--font-sans)', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'Cambria', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
