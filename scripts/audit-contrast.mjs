// Checks the colour pairings the design system actually uses, for every theme.
// Run: node scripts/audit-contrast.mjs   (exits 1 if anything is below WCAG AA)
import fs from 'node:fs'

const src = fs.readFileSync(new URL('../src/theme/themes.ts', import.meta.url), 'utf8')
const themes = [...src.matchAll(/id: '([a-z]+)',[^\n]*\n\s*name: '([^']+)',\s*shades: \{([\s\S]*?)\},\n\s*\},/g)].map((m) => ({
  name: m[2],
  s: Object.fromEntries([...m[3].matchAll(/(\d+): '(#[0-9a-f]{6})'/g)].map((x) => [x[1], x[2]])),
}))

const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const lum = (h) => [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16))).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0)
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// [label, foreground step, background step ('white' allowed)]
const pairs = [
  ['white on brand-600 (primary button, active nav, pager)', 'white', '600'],
  ['white on brand-700 (primary hover)', 'white', '700'],
  ['brand-600 on white (outline button, links)', '600', 'white'],
  ['brand-700 on white (outline button)', '700', 'white'],
  ['brand-700 on brand-50 (outline button hover)', '700', '50'],
  ['brand-700 on brand-100 (badge)', '700', '100'],
  ['brand-800 on brand-50 (banner)', '800', '50'],
]
const get = (t, k) => (k === 'white' ? '#ffffff' : t.s[k])

let failed = 0
for (const t of themes) {
  const bad = pairs.map(([label, fg, bg]) => [label, ratio(get(t, fg), get(t, bg))]).filter(([, r]) => r < 4.5)
  const min = Math.min(...pairs.map(([, fg, bg]) => ratio(get(t, fg), get(t, bg))))
  console.log(`${bad.length ? 'FAIL' : 'ok  '} ${t.name.padEnd(9)} min ${min.toFixed(2)}${bad.map(([l, r]) => `\n       ${r.toFixed(2)}  ${l}`).join('')}`)
  failed += bad.length
}
process.exit(failed ? 1 : 0)
