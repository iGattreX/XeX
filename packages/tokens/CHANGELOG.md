# @xex/tokens

## 0.9.0

### Minor Changes

- 801b1d6: New `Tooltip`, replacing the browser's `title` tooltip: it opens just below and to the right of the mouse pointer (clear of the cursor), or below the control for keyboard focus, or on a side of the control with `placement`. It follows the theme and dark mode, opens quickly, closes on Escape, stays open while the pointer is over it, opens on a long press on touch screens, and is linked to its control with `aria-describedby`. It is always kept inside the screen (clear of any scrollbar) and is drawn at the top level of the page, so it cannot be clipped or covered by a header, drawer or dialog. The light/dark button and the sidebar collapse button use it.

## 0.8.0

### Minor Changes

- 412c729: New `Combobox`: one dropdown for single or multiple choice, with an optional search box (shown by default for more than 8 options), icons, and slots for a header, notices and lazy loading. `FontPicker`, `ThemeSelect` and `MultiSelect` are now built on it, so all their dropdowns share the same shape (the popup has the control's rounded corners, sits 4px below it, with a thin faint shadow) and the same keyboard behaviour. The font picker remembers its category chip for the browser session, and rows no longer get a theme-coloured border on hover (keyboard navigation keeps its ring). Native `Select` stays the default for plain form fields. New `ScrollRail`: a thin draggable scroll control in the style of "On this page", used by the dropdown lists in place of the browser's scrollbar. `MultiSelect`'s options are now `role="option"` in a listbox, not checkboxes in a group. `useTheme()` also returns `storagePrefix`.
- 412c729: Dark mode uses neutral greys instead of navy blues: the page, cards, borders, grey text scale, progress-ring track and loading overlay no longer have a blue cast. The brand colour still tints what asks for it (buttons, links, accent backgrounds), now mixed into the neutral background. Contrast is unchanged in every theme (WCAG AA).
- 412c729: `Section` takes `appearance="card"` (default) or `"plain"` (no border, background or shadow, for use inside another panel), and `padded={false}` to drop a plain Section's padding (a card is always padded). `Sidebar` entries can have `children`, shown indented beneath their parent.

## 0.7.0

### Minor Changes

- fb1a55b: `Header` gets a `density` prop: `comfortable` (the default, unchanged) or `compact` (less padding, a smaller title and a one-line subtitle), and a faint shadow under it. The theme dropdown's options use the same gradient swatches as the swatch picker, and its list now opens toward the side with room so it is no longer clipped on phones.
- 82eb697: `DataTable` rows can open a details view. Set `detail` to `true` for a read-only list of every column, or to a function that renders your own content (a form, say); `detailTitle` sets the heading. In a table the details open in a side panel beside the list; on cards, or when the table is narrow, they replace the list with a Back button. Focus moves to the details and returns to the row on close; Escape closes. Cards get a faint hover shadow. The table's toolbar and footer controls now use one text size (matching the layout toggle) and uniform heights, `PaginationBar` takes a `textSize`, and the filter dropdown's shadow is lighter. The edge fade on a scrolling table is removed.

## 0.6.0

### Minor Changes

- 8377288: `DataTable` gets a Cards layout: a third option beside Comfortable and Compact that shows each row as a card (first column as the title, the others as label/value pairs). By default (`cards="auto"`) a table switches to cards on its own when it is narrow, such as on a phone, and the user can choose. In cards, a "Sort by" dropdown replaces the column headers. Columns accept `cardLabel` and `hideInCards`; `cards="always"` / `"never"` fix the layout. The pagination bar now wraps on small widths, and a scrolling table fades at the edge that has more to see.

## 0.5.0

### Minor Changes

- 70053cf: Add `ThemeSelect`, a dropdown that lists every theme with its primary colour and name, and `ModeToggle`, a separate light/dark button. `ThemeSwitcher` gains `variant="dropdown"` (a `ThemeSelect` plus an icon-only `ModeToggle`); the default swatches layout is unchanged.

## 0.4.0

### Minor Changes

- 1f87fa6: Add `Switch`, `Checkbox`, `Radio`, `RadioGroup` and `Textarea` components. `Sidebar` takes a `brand` prop (and a new `SidebarBrand` component) so apps can show their own logo and name. The sidebar collapse button is now a subtler single chevron.

## 0.3.0

No changes in this release.

## 0.2.1

### Patch Changes

- ce81623: Point the package metadata (repository, homepage, bugs) at the renamed GitHub repository, `iGattreX/XeX`.

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
