# 2026-03-12 2127 DensityControls

## TL;DR
- What changed: Added per-project layout settings for density (`2x2`, `3x3`, `4x4`) and photo visibility, replaced fixed 2-up pagination with density-aware row-group pagination, and updated the sidebar and item card UI to support text-only and denser photo layouts.
- Why: The tool needed a denser punch list mode without giving up room grouping, continued headers, or WYSIWYG print behavior.
- What didn't work: Repo-wide lint still fails because of legacy `PunchList_925Park.jsx`; the new `src/` refactor itself linted clean with `npx eslint src`.
- Next: Manually verify print/PDF output and real-world readability for 3x3 and 4x4, especially 4x4 with photos on.

---

## Full notes

- Added `src/layout.js` for shared density defaults and layout normalization.
- Reworked `src/pagination.js` to pack General Notes and rooms into row groups that can span 2, 3, or 4 columns per row, while keeping per-room continuation labels tied only to the carried span.
- Rebuilt `src/PunchListApp.jsx` around the new layout model:
  - project data now carries `layout`
  - legacy projects backfill missing layout settings on load
  - layout changes autosave with the project
  - page rendering now uses section header spans, item grids, and aligned action rows
- Updated `src/ProjectSidebar.jsx` to expose layout controls in the existing sidebar.
- Updated `src/ItemCard.jsx` so cards can render with or without a photo cell and tighten typography by density.
- Replaced the old pair/single-room CSS in `src/styles.css` with row-group, span-based, and density-specific styles.
- Verification run:
  - `npm run build` — passed
  - `npm.cmd run lint` — failed only on known legacy `PunchList_925Park.jsx`
  - `npx eslint src` — passed
