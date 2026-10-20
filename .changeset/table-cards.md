---
'@xex/ui': minor
'@xex/tokens': minor
'@xex/tailwind-preset': minor
---

`DataTable` gets a Cards layout: a third option beside Comfortable and Compact that shows each row as a card (first column as the title, the others as label/value pairs). By default (`cards="auto"`) a table switches to cards on its own when it is narrow, such as on a phone, and the user can choose. In cards, a "Sort by" dropdown replaces the column headers. Columns accept `cardLabel` and `hideInCards`; `cards="always"` / `"never"` fix the layout. The pagination bar now wraps on small widths, and a scrolling table fades at the edge that has more to see.
