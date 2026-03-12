# 2026-03-11 2306 SeedDataAndAffordances

## TL;DR
- What changed: Replaced project-specific seed content with neutral example data, added description placeholders, and made delete affordances read more clearly on hover.
- Why: The starter state should be reusable and non-project-specific, and the remove controls needed stronger visual feedback.
- What didn't work: No new blocker in the active app path; legacy lint issues outside `src/` still remain.
- Next: Decide whether existing local browser saves should continue to override the new neutral defaults or whether a reset/clear action should be added.

---

## Full notes

- `src/PunchListApp.jsx` seed data now uses:
  - `Project Name`
  - `Proj. # 0000`
  - neutral site conditions
  - four example general notes
  - generic example rooms/items instead of the prior job-specific content
- `src/ItemCard.jsx` and the single-item room renderer in `src/PunchListApp.jsx` now show `Click here to enter description` as placeholder text for empty description fields.
- `src/styles.css` now:
  - colors the site-condition remove `x` red when the row is hovered
  - colors item remove `x` red when the item area is hovered
  - makes the room-header `Remove` button white by default with the existing fill-on-hover treatment
  - adds muted placeholder styling for empty description boxes
- Verification:
  - `npm run build` passed
