# 2026-03-13 0059 EditableSummaryDescriptions

## TL;DR
- What changed: Summary description cells are now live textareas that edit the same item description used by the detailed photo/grid pages.
- Why: The summary view is now the fastest place to scan and correct text, so it needed to be a true edit surface instead of a read-only preview.
- What didn't work: The summary originally rendered plain text only, so edits had to happen further back in the detailed pages even when the summary already exposed the same content.
- Next: Validate the editing feel on a real long-note project and make sure wrapped summary text still feels legible in print preview.

---

## Full notes

- Reused the existing `updateItem` reducer path so summary edits update the shared underlying item state instead of introducing a second description model.
- Replaced the read-only summary description cell with a `textarea` bound to `entry.description`.
- Styled the summary description editor to fill the cell, wrap text naturally, and keep the same serif summary typography with a light focus background.
- Kept location and item-code cells read-only; only the description is editable from the summary.
- Re-verified with `npm run build` and `npx eslint src`.
