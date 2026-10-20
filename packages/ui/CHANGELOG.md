# @xex/ui

## 0.6.0

### Minor Changes

- 8377288: `DataTable` gets a Cards layout: a third option beside Comfortable and Compact that shows each row as a card (first column as the title, the others as label/value pairs). By default (`cards="auto"`) a table switches to cards on its own when it is narrow, such as on a phone, and the user can choose. In cards, a "Sort by" dropdown replaces the column headers. Columns accept `cardLabel` and `hideInCards`; `cards="always"` / `"never"` fix the layout. The pagination bar now wraps on small widths, and a scrolling table fades at the edge that has more to see.

### Patch Changes

- Updated dependencies [8377288]
  - @xex/tokens@0.6.0

## 0.5.0

### Minor Changes

- 70053cf: Add `ThemeSelect`, a dropdown that lists every theme with its primary colour and name, and `ModeToggle`, a separate light/dark button. `ThemeSwitcher` gains `variant="dropdown"` (a `ThemeSelect` plus an icon-only `ModeToggle`); the default swatches layout is unchanged.

### Patch Changes

- Updated dependencies [70053cf]
  - @xex/tokens@0.5.0

## 0.4.0

### Minor Changes

- 1f87fa6: Add `Switch`, `Checkbox`, `Radio`, `RadioGroup` and `Textarea` components. `Sidebar` takes a `brand` prop (and a new `SidebarBrand` component) so apps can show their own logo and name. The sidebar collapse button is now a subtler single chevron.

### Patch Changes

- Updated dependencies [1f87fa6]
  - @xex/tokens@0.4.0

## 0.3.0

### Minor Changes

- acb5c49: The sidebar can now be collapsed on wide screens to give the page more room.
  
  - `Sidebar` takes `collapsed` and `onToggleCollapse`. While collapsed it behaves as it does on a narrow screen: out of the page flow and the tab order, opened as a slide-over drawer. In the docked state a "Collapse navigation" button appears; in the drawer a "Keep navigation open" button pins it back.
  - `Header` takes `menuAlwaysVisible`, so the menu button that opens the drawer also shows at wide widths while collapsed.
  - New `useSidebarCollapsed(storageKey)` hook remembers the choice in localStorage (give each app its own key).
  - Existing apps are unaffected: without `onToggleCollapse` there is no button and nothing changes.

### Patch Changes

- @xex/tokens@0.3.0

## 0.2.1

### Patch Changes

- ce81623: Point the package metadata (repository, homepage, bugs) at the renamed GitHub repository, `iGattreX/XeX`.
- Updated dependencies [ce81623]
  - @xex/tokens@0.2.1

## 0.2.0

### Minor Changes

- 444cfe7: Dark mode is now driven by semantic tokens instead of per-class overrides.
  
  **What changed**
  
  - `@xex/tokens/styles.css` defines CSS variables for both modes: the neutral scale (`--gray-*`), `--canvas`, `--surface`, brand-derived accents (`--accent`, `--accent-soft`, `--accent-softer`, `--accent-line`) and five status tones (`danger`, `success`, `warning`, `info`, `purple`, each with a solid, `-soft`, `-line` and `-ink` variable). The long list of `html[data-mode='dark'] .bg-white { … !important }` overrides is gone.
  - `@xex/tailwind-preset` maps those variables to Tailwind colours: `gray-*` is remapped (so every `gray-*` utility flips in dark mode on its own), plus `canvas`, `surface`, `accent`, `danger`, `success`, `warning`, `info` and `purple`.
  - `@xex/ui` components use the tokens (`bg-surface`, `text-accent`, `bg-danger-soft`, …).
  
  **Upgrading**
  
  - Replace `bg-white` with `bg-surface` for cards and panels. `bg-white` no longer changes in dark mode.
  - Use `text-accent`, `bg-accent-soft` and `border-accent-line` for brand-coloured text, tints and borders that must adapt to dark mode. `bg-brand-600`-style solid brand colours are unchanged.
  - Use the status tones (`bg-danger-soft text-danger-ink`, …) instead of raw `red-*` / `emerald-*` / `amber-*` / `sky-*` / `purple-*` for status colours.
  - `ThemeProvider` already took care of `<html data-mode>`; nothing to change there.
  
  **Accessibility**
  
  - Every theme now passes WCAG 2.x AA in light and dark (checked with axe in a real browser).
  - Secondary text moved from `gray-400` (2.5:1) to `gray-500`; `Avatar` default colours are darker so the white initials meet 4.5:1; `DataTable` filter dropdowns default to "Any <column>".

### Patch Changes

- Updated dependencies [444cfe7]
  - @xex/tokens@0.2.0
