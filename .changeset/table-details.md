---
'@xex/ui': minor
'@xex/tokens': minor
'@xex/tailwind-preset': minor
---

`DataTable` rows can open a details view. Set `detail` to `true` for a read-only list of every column, or to a function that renders your own content (a form, say); `detailTitle` sets the heading. In a table the details open in a side panel beside the list; on cards, or when the table is narrow, they replace the list with a Back button. Focus moves to the details and returns to the row on close; Escape closes. Cards get a faint hover shadow. The table's toolbar and footer controls now use one text size (matching the layout toggle) and uniform heights, `PaginationBar` takes a `textSize`, and the filter dropdown's shadow is lighter. The edge fade on a scrolling table is removed.
