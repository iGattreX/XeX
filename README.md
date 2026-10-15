# XeX design system

React 19 + TypeScript + Tailwind CSS components with runtime-switchable colour themes (light and dark for each).

| Package | What it is |
|---|---|
| [`@xex/ui`](packages/ui) | Components, app shell (`Sidebar`, `Header`, `PageGuide`), `ThemeProvider` |
| [`@xex/tokens`](packages/tokens) | Colour themes, font helpers and the shared stylesheet (`styles.css`) |
| [`@xex/tailwind-preset`](packages/tailwind-preset) | Tailwind preset: the `brand-50…900` scale and font families |
| [`apps/docs`](apps/docs) | The documentation / playground site (not published) |

## Using it in an app (any repo)

```bash
npm install @xex/ui @xex/tokens @xex/tailwind-preset
npm install -D tailwindcss@3 postcss autoprefixer
npm install @fontsource/inter        # the default typeface, self-hosted
```

`tailwind.config.js`

```js
import xex from '@xex/tailwind-preset'

export default {
  presets: [xex],
  content: ['./index.html', './src/**/*.{ts,tsx}', './node_modules/@xex/ui/dist/**/*.js'],
}
```

`src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`src/main.tsx`

```tsx
import { ThemeProvider } from '@xex/ui'
import '@fontsource/inter/400.css' // …500, 600, 700
import './index.css'
import '@xex/tokens/styles.css' // import AFTER your own CSS

createRoot(document.getElementById('root')!).render(
  <ThemeProvider storagePrefix="my-app">
    <App />
  </ThemeProvider>,
)
```

- **`storagePrefix`**: give every app its own. Theme, mode and font are saved in `localStorage` as `<prefix>-theme` etc.; apps on one domain would otherwise overwrite each other.
- **Fonts**: nothing in the core talks to Google. Only the optional `@xex/ui/font-picker` entry loads fonts from Google Fonts (and the font list from Fontsource) when a user opens or uses it. Apps that don't want those requests simply don't import it.
- Other `ThemeProvider` props: `themes`, `defaultThemeId`, `defaultFont`.

## Working in this repo

```bash
npm install
npm run dev              # builds the packages, then starts the docs site
npm run typecheck        # builds packages, then type-checks everything
npm run audit:contrast   # WCAG check of every theme's colour pairings
npm run pack:check       # shows exactly what each package would publish
```

Inside the repo the docs site imports the packages' **source** (Vite aliases), so edits show up instantly; the built `@xex/tokens/styles.css` is the one exception, so `npm run dev` builds it first.

## Releasing

Packages are versioned together while the API settles (`0.x`). Releases are published by GitHub Actions using npm trusted publishing: no npm token is stored anywhere, and every version carries an npm provenance badge.

```bash
node scripts/set-version.mjs 0.1.1   # sets every package, the internal @xex/* ranges and the lockfile
git add -A && git commit -m "Release v0.1.1" && git push
git tag v0.1.1 && git push origin v0.1.1
```

Pushing the tag starts the Release workflow: it type-checks, builds, publishes any package version not yet on npm, and creates the GitHub release. It refuses to run if the tag and the package versions disagree.

One-time setup (already done for 0.1.0 if you followed the repo's setup): on npmjs.com open each package → Settings → Trusted Publisher → GitHub Actions, and enter owner `iGattreX`, repository `xex`, workflow filename `release.yml`, environment empty.

## Licence

[MIT](LICENSE)
