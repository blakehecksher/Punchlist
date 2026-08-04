# 2026-08-01 0225 Card-count labels

## TL;DR
- What changed: Renamed the punch list view controls from Large/Medium to 4 Cards/6 Cards and updated their tooltips.
- Why: Make the controls describe the actual number of cards shown per page.
- What didn't work: Nothing blocking.
- Next: Continue browser validation as needed.

---

## Full notes

- `ProjectSidebar.jsx` now renders `4 Cards` for the `2x2` density and `6 Cards` for the `3x3` density.
- Accessible titles now say `4 Cards per page` and `6 Cards per page`.
- `npm.cmd run lint` and `npm.cmd run build` both pass.
