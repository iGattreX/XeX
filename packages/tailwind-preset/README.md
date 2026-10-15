# @xex/tailwind-preset

Tailwind CSS v3 preset for the XeX design system: `brand-50 … brand-900` (driven by CSS variables that `ThemeProvider` sets at runtime), font families, and dark mode via `[data-mode="dark"]`.

```js
import xex from '@xex/tailwind-preset'
export default {
  presets: [xex],
  content: ['./src/**/*.{ts,tsx}', './node_modules/@xex/ui/dist/**/*.js'],
}
```

MIT licensed.
