# 2026-03-13 1153 SummaryNoFillers

## TL;DR
- What changed: Removed the rendered blank filler rows from summary pages so the summary table ends at the last real item on each page.
- Why: The filler rows were the remaining cause of the false “stretched” bottom area and the odd lower border behavior on later summary pages.
- What didn't work: Trying to preserve the old fill-to-page table shape after switching to natural row heights kept creating border artifacts and visual confusion.
- Next: Recheck a multi-page summary in the browser and print preview to confirm the table now stops cleanly after the last item on each page.

---

## Full notes

- Deleted the `emptyRows` rendering path in `src/PunchListApp.jsx` so summary pages only render actual entries.
- Removed the now-unused empty-row CSS in `src/styles.css`.
- Left summary pagination intact; page breaking still uses the summary height estimate, but the table no longer renders placeholder rows for unused capacity.
- Verified `npx.cmd eslint src` passes.
- Verified `npm.cmd run build` passes.
