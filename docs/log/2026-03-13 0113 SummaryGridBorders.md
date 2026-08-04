# 2026-03-13 0113 SummaryGridBorders

## TL;DR
- What changed: Fixed the summary row alignment so the vertical borders around the item-code column span the full row height.
- Why: The summary grid should read as a clean table, but the previous row alignment caused those borders to only match the text height instead of the full cell height.
- What didn't work: The summary rows were using `align-items: start`, which prevented the grid cells from stretching and made the separators look broken.
- Next: Quick browser check on a summary page with both single-line and multi-line rows to confirm the grid looks consistent across both cases.

---

## Full notes

- Split summary header and summary row alignment so headers can stay centered while body rows stretch to full height.
- Left the multiline summary pagination and editable description behavior intact.
- Re-verified with `npm run build` and `npx eslint src`.
