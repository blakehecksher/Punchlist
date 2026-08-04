# 2026-08-01 0219 Sidebar viewport polish

## TL;DR
- What changed: Made the sidebar a viewport-height column with a scrollable list area, tightened the vertical spacing, and fixed inactive-row hover colors.
- Why: Keep the sidebar controls visible without a full-panel scrollbar and keep inactive punch-list names readable on hover.
- What didn't work: Nothing blocking.
- Next: Continue browser validation at desktop and narrow widths.

---

## Full notes

- The sidebar now uses the viewport height below the toolbar and hides its outer overflow.
- The punch-list list owns the remaining flexible space and retains stable scrollbar gutter behavior.
- Header, view, tools, and file sections use tighter spacing so they remain visible within the sidebar.
- Inactive row hover uses the light workspace background; the active row remains dark.
- `npm.cmd run lint` and `npm.cmd run build` both pass.
