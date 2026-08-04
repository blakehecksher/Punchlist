# 2026-03-13 0049 SummaryWrapAndSpacing

## TL;DR
- What changed: Tightened the summary table column widths so `Location` takes less space and `Description` gets more room, and changed summary descriptions to wrap instead of staying one-line clipped.
- Why: Real notes like the Stair Hall example were getting cut off in the summary even though the detailed pages had the full text.
- What didn't work: The original summary cells forced `white-space: nowrap`, so longer descriptions were always ellipsized regardless of available vertical space.
- Next: Check a real project in the browser and print preview to confirm the wrapped summary rows still read cleanly at higher item counts.

---

## Full notes

- Reduced the summary `Location` column width to roughly 70% of its previous size and also tightened the fixed `Item` column slightly.
- Reallocated the freed width to the `Description` column.
- Lowered summary cell padding and font size slightly to make wrapped text fit more comfortably inside each summary row.
- Allowed summary descriptions to wrap with `overflow-wrap: anywhere` while leaving location and item cells as single-line fields.
- Re-verified with `npm run build` and `npx eslint src`.
