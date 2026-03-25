# 2026-03-25 1550 NewItemStatusAndSummaryCounts

## TL;DR
- What changed: added explicit `isNew` item metadata, summary counts for total/new/revised/completed, and copy/export behavior that underlines only the issue code for new items.
- Why: `new` needed to be tracked independently from description formatting, counted reliably in the summary, and round-tripped through external editing in Word/Notion.
- What didn't work: browser-level validation of HTML clipboard paste into Word/Notion and end-to-end merge re-imports with real project data was not run from the terminal session.
- Next: test the full copy-edit-import loop in the browser and confirm removing the external underline clears `new` status on re-import.

---

## Full notes

- Updated `src/importParser.js` so imported General Notes and room items now return `{ issueCode, isNew, description }`.
- Added import support for underlined issue codes using `__CODE__:` as the signal for `isNew`.
- Treated imported items with no issue code as new items, which matches the workflow where the app assigns a new issue code during import.
- Updated `src/PunchListApp.jsx` so items now store `isNew`, old saved data normalizes missing values to `false`, and merge/appended imports carry `isNew` through item creation and matched-item updates.
- Merge behavior now clears `isNew` on matched coded items when the imported issue code is no longer underlined.
- Extended summary data so the summary header now reports:
  - total items
  - new items
  - revised items
  - completed items
- Updated `src/exportNotes.js` so:
  - plain-text note export marks new issue codes as `__CODE__`
  - rich HTML note export wraps only new issue codes in `<u>...</u>`
  - clipboard copy prefers HTML + plain text together and falls back to plain text if rich clipboard write fails
- Updated `src/styles.css` so the summary count area can show the expanded stat set cleanly.
- Verified locally with:
  - `npx.cmd eslint src`
  - `npm.cmd run build`
  - a Node smoke test covering underlined-code import parsing and underlined issue-code export generation
