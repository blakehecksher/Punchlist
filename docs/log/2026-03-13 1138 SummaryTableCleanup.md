# 2026-03-13 1138 SummaryTableCleanup

## TL;DR
- What changed: Stopped the summary table from stretching to the bottom of the page and restored the missing column borders in the empty rows at the bottom of later summary pages.
- Why: After the auto-height change, the summary wrapper was still flexing to fill leftover page space and the placeholder rows were no longer real table rows.
- What didn't work: Rendering empty summary rows as bare blocks broke the lower column separators, and leaving the table wrapper at `flex: 1` made the last visible row look like it was dragging the table to the page bottom.
- Next: Quick browser and print check on a multi-page summary to confirm the bottom spacing and empty-row borders now look stable.

---

## Full notes

- Removed `flex: 1` from the summary table wrapper in `src/styles.css` so the table height follows its content instead of filling the remaining page area.
- Kept the baseline summary row height, but changed empty filler rows back into real three-cell grid rows in `src/PunchListApp.jsx`.
- Added a `summary-cell--empty` class so those filler cells keep the vertical borders without showing placeholder text.
- Verified `npx.cmd eslint src` passes.
- Verified `npm.cmd run build` passes.
