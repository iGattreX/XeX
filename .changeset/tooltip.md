---
'@xex/ui': minor
'@xex/tokens': minor
'@xex/tailwind-preset': minor
---

New `Tooltip`, replacing the browser's `title` tooltip: it opens just below and to the right of the mouse pointer (clear of the cursor), or below the control for keyboard focus, or on a side of the control with `placement`. It follows the theme and dark mode, opens quickly, closes on Escape, stays open while the pointer is over it, opens on a long press on touch screens, and is linked to its control with `aria-describedby`. It is always kept inside the screen (clear of any scrollbar) and is drawn at the top level of the page, so it cannot be clipped or covered by a header, drawer or dialog. The light/dark button and the sidebar collapse button use it.
