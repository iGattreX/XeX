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
npm test                 # component tests (Vitest + Testing Library + axe structure checks)
npm run test:e2e         # real-browser accessibility tests (Playwright + axe, incl. contrast)
npm run audit:contrast   # WCAG check of every theme's colour pairings
npm run pack:check       # shows exactly what each package would publish
npm run changeset        # describe a change for the next release
```

Inside the repo the docs site imports the packages' **source** (Vite aliases), so edits show up instantly; the built `@xex/tokens/styles.css` is the one exception, so `npm run dev` builds it first. The first `npm run test:e2e` needs a browser: `npx playwright install chromium`.

### Colours and dark mode

Dark mode is a change of CSS variable values (see `packages/tokens`), not a list of overrides, so write components with the tokens:

| Use | Class |
|---|---|
| Page / card / panel background | `bg-canvas` / `bg-surface` |
| Neutral text, borders, fills | `gray-*` utilities (the scale flips in dark mode by itself) |
| Brand-coloured text, tinted backgrounds and borders | `text-accent`, `bg-accent-soft`, `bg-accent-softer`, `border-accent-line` |
| Solid brand colour (buttons) | `bg-brand-600` etc. (unchanged between modes) |
| Status colours | `bg-danger-soft text-danger-ink border-danger-line`, same for `success`, `warning`, `info`, `purple` |

Avoid `bg-white`, `text-gray-400` for real text (2.5:1 on white), and raw `red-*`/`emerald-*` for status colour. The end-to-end tests check every theme in light and dark against WCAG 2.x AA and fail on any contrast violation.

## Branching

`main` is what gets released, so it only receives changes that already passed CI. Day-to-day work happens on `dev`:

```bash
git switch dev && git pull            # start from the latest dev
git switch -c feature/short-name      # optional: one branch per piece of work
# ...work, commit, push; open a pull request into dev (CI runs on it)
```

- **`dev`**: integration branch, free to push to. CI runs on every push. If something goes wrong, undo it on `dev` (`git revert <sha>`, or a pull request that reverts) and `main` never sees it.
- **Releasing**: open a pull request **dev → main**, wait for CI, and merge it with a **merge commit** (not squash, so the two branches stay in step). Include a changeset (`npm run changeset`) for any change to a published package. The **Version packages** workflow then opens its release pull request against `main`, as described below.
- **After a release**, bring `main` back into `dev` (the version bump and changelogs only exist on `main`): `git switch dev && git pull origin main && git push`.
- **Throwing work away**: delete the branch, or reset `dev` to `main` (`git switch dev && git reset --hard origin/main && git push --force-with-lease`) if `dev` has gone wrong. This is why `main` is protected and `dev` is not.
- Tags and releases are only ever made on `main`.

## Releasing

Packages are versioned together while the API settles (`0.x`). Releases are published by GitHub Actions using npm trusted publishing: no npm token is stored anywhere, and every version carries an npm provenance badge.

Versions and changelogs come from [changesets](.changeset/README.md):

1. With any change to a published package, run `npm run changeset` and commit the generated file.
2. On every push to `main`, the **Version packages** workflow opens (or updates) a "Version packages" pull request that bumps the versions, updates the internal `@xex/*` ranges and the lockfile, and writes each package's `CHANGELOG.md`.
3. Merge that pull request, then tag the version it contains:

```bash
git pull
git tag v0.2.0 && git push origin v0.2.0
```

Pushing the tag starts the Release workflow: it type-checks, builds, runs the tests, **publishes** every package version not yet on npm (in order: tokens, preset, ui), and creates the GitHub release. It refuses to run if the tag and the package versions disagree. Because publishing is automatic, the tag is the release decision: only tag a commit whose CI is green.

Authentication is npm trusted publishing (OIDC): no token is stored, and every version carries a provenance badge. The trusted publisher on npm allows **direct publish**; if you would rather require a 2FA approval for each release, turn it off there, change `npm publish` to `npm stage publish` in `release.yml`, and approve each staged version on npmjs.com (or with `npm stage approve`).

Note: pull requests opened by a workflow with the default token do not trigger other workflows, so the "Version packages" PR shows no CI checks. The repo owner can merge it anyway (branch protection does not apply to admins); CI runs on `main` right after.

The npm trusted publisher only allows staged publishing, so nothing is public until you approve it (2FA): on npmjs.com for each package, or in a terminal with `npm stage list` and `npm stage approve`. Approve `@xex/tokens` first, then `@xex/tailwind-preset`, then `@xex/ui` (ui depends on tokens).

One-time setup, per package, on npmjs.com: Settings → Trusted Publisher → GitHub Actions → owner `iGattreX`, repository `XeX`, workflow filename `release.yml`, environment empty; enable "direct publish" (the workflow runs `npm publish`) and leave "dist-tag management" off.

## Licence

[MIT](LICENSE)
