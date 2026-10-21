---
'@xex/ui': minor
'@xex/tokens': minor
'@xex/tailwind-preset': minor
---

New `Combobox`: one dropdown for single or multiple choice, with an optional search box (shown by default for more than 8 options), icons, and slots for a header, notices and lazy loading. `FontPicker`, `ThemeSelect` and `MultiSelect` are now built on it, so all their dropdowns share the same shape (the popup has the control's rounded corners, sits 4px below it, with a thin faint shadow) and the same keyboard behaviour. The font picker remembers its category chip for the browser session, and rows no longer get a theme-coloured border on hover (keyboard navigation keeps its ring). Native `Select` stays the default for plain form fields. New `ScrollRail`: a thin draggable scroll control in the style of "On this page", used by the dropdown lists in place of the browser's scrollbar. `MultiSelect`'s options are now `role="option"` in a listbox, not checkboxes in a group. `useTheme()` also returns `storagePrefix`.
