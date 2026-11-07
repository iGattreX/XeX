# XeX conventions

## Components live in `@xex/ui`, never in an app
- Every control must be a named export of `packages/ui/src` (via `components/index.ts` or `layout/`). Never define a control locally in the docs app or any consumer; if one is missing, add it to the library first.
- The docs Controls page shows the code for each control as you use it (the code dock). Every exported component needs an entry in `apps/docs/src/code/snippets.ts`; a unit test enforces this.
- Naming: PascalCase, named for what it is (`Switch`, `Checkbox`, `RadioGroup`, `Textarea`). Variants are string props (`variant`, `size`).

## Building an app on XeX
- Use `ThemeProvider` with an app-specific `storagePrefix`; use `Sidebar` / `Header` for the shell and pass `brand` to `Sidebar` for the app's own logo and name.
- Colours come from tokens only (`brand-*`, `surface`, `canvas`, `gray-*`, `accent*`, status tones). No hex values, no `dark:` classes: dark mode is a change of token values.
- Text on backgrounds must meet WCAG AA in every theme and both modes; the contrast audit and axe tests enforce this.

## Workflow
- Short-lived feature branches into protected `main` via PR (squash merge). Add a changeset (`npm run changeset`) for any change to a published package.
- Before a PR: `npm run typecheck` and the unit tests (`npm test`), plus only the browser tests for what changed (`npx playwright test --config apps/docs/playwright.config.ts <name>`). CI runs the whole browser suite, so do not run it locally for every change. The e2e script rebuilds first; running Playwright directly does not, so rebuild (`npm run build`) after changing the app.
- Open the PR with auto-merge (`gh pr merge <n> --auto --squash --delete-branch`) and move on: it merges itself when the `verify` check passes. CI skips the browser tests for changes that touch only docs or changesets.

## Releasing
- Merging a PR does not release by itself. Several PRs can be merged, and their changesets collect in one "Version packages" PR (opened by the Version workflow).
- Merging that Version PR is the release: the Release workflow publishes the three packages to npm (trusted publishing, no token) and creates the `vX.Y.Z` tag and GitHub release. There is no manual tag to push. A bot-opened PR gets no CI, so it is merged with admin rights (`gh pr merge <n> --squash --admin`).
- Release when asked, not after every change, and do not poll npm afterwards: the Release workflow succeeding is the confirmation. To retry a failed publish, run the Release workflow by hand (Actions, Release, Run workflow).
