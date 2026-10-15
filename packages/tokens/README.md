# @xex/tokens

Design tokens for the XeX design system.

```ts
import { themes, getTheme, SHADE_STEPS, fontStack, DEFAULT_FONT } from '@xex/tokens'
import '@xex/tokens/styles.css' // brand overrides, dark mode and shared classes
```

- `themes`: the colour presets (each has `shades` 50–900). Run `npm run audit:contrast` in the repo to check one.
- `styles.css`: plain CSS (no Tailwind directives); import it once, after your own CSS.

MIT licensed.
