---
'@xex/ui': minor
---

The sidebar can now be collapsed on wide screens to give the page more room.

- `Sidebar` takes `collapsed` and `onToggleCollapse`. While collapsed it behaves as it does on a narrow screen: out of the page flow and the tab order, opened as a slide-over drawer. In the docked state a "Collapse navigation" button appears; in the drawer a "Keep navigation open" button pins it back.
- `Header` takes `menuAlwaysVisible`, so the menu button that opens the drawer also shows at wide widths while collapsed.
- New `useSidebarCollapsed(storageKey)` hook remembers the choice in localStorage (give each app its own key).
- Existing apps are unaffected: without `onToggleCollapse` there is no button and nothing changes.
