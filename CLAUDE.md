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
- Before a PR: `npm run typecheck`, `npm test`, `npm run test:e2e`.
