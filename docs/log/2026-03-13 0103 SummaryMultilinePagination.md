# 2026-03-13 0103 SummaryMultilinePagination

## TL;DR
- What changed: Summary pagination now estimates multi-line description height and lets longer entries span multiple summary row units.
- Why: CSS wrapping alone was not enough; long descriptions wrapped visually but still only had one fixed row of height, so they overlapped the next item.
- What didn't work: The first summary-wrap pass only changed cell styles and did not change how many row units each summary item was allocated.
- Next: Validate a real summary page with several long descriptions in both the browser and print preview.

---

## Full notes

- Added a summary-entry row-span estimate in `src/pagination.js` based on description length and line breaks.
- Updated `paginateSummary(...)` to pack entries by consumed row units instead of raw item count alone.
- Passed the computed `lineSpan` through to the summary renderer so long items span multiple grid rows.
- Updated the editable summary description textarea to size itself from the same computed row span.
- Re-verified with `npm run build` and `npx eslint src`.
