# 2026-03-25 1741 InlineSummaryCount

## TL;DR
- What changed: The summary count chips now remain visible on the first detail page when summary pages are turned off.
- Why: The counts should not disappear when the summary-page toggle is disabled.
- What didn't work: No browser-only visual check was run for the first detail-page layout.
- Next: Confirm in the browser that the count row sits cleanly above the first detail-page section with summary pages disabled.

---

## Full notes

- Added a shared `renderSummaryCount()` helper in `src/PunchListApp.jsx` so the same count chips render in both summary-page and detail-page contexts.
- Kept the existing summary-page header layout unchanged.
- Added an inline count row to the first detail page only when summary pages are disabled, so the counts appear above the first section instead of disappearing.
- Added `.summary-header-row--detail` in `src/styles.css` to right-align that standalone count row without the `Summary` label.
- Verified with `npx.cmd eslint src` and `npm.cmd run build`.
