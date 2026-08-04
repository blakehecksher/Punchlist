# 2026-03-13 0019 SortExportAndNumbering

## TL;DR
- What changed: Renamed the summary heading/count copy, fixed stale and duplicate issue-sequence handling, added a manual sidebar room-sorting button, and added markdown export with import round-trip support.
- Why: Live use exposed duplicate `GN-01` numbering, the summary wording needed simplification, room ordering needed an explicit control, and notes needed an export path that works with external markdown documents.
- What didn't work: The first issue-sequence backfill only handled missing values, not duplicated positive values, so older projects could still display repeated issue codes until the loader logic was hardened.
- Next: Validate an older project reload, test `Sort Rooms` with real room names, and run an export/import markdown round-trip in the browser.

---

## Full notes

- Updated issue-sequence normalization so duplicate stored `issueSeq` values are reassigned to the next available number instead of being preserved.
- Hardened `addGeneralNote`, `addRoomItem`, and import flows to derive the next issue code from both the saved counter and the current max item sequence.
- Changed the summary page copy from `Open Items Summary` / `N open items` to `Summary` / `N items`.
- Added a `Sort Rooms` action to the sidebar and wired a reducer action that sorts room names with numeric-aware ordering only when explicitly requested.
- Added `src/exportNotes.js` and an `Export Notes` toolbar button that downloads a markdown outline with Site Conditions, General Notes, room headings, and issue-code-prefixed item lines.
- Updated the importer to strip exported issue-code prefixes like `GN-01:` or `101-03:` back off during re-import so descriptions stay clean.
- Verified with `npm run build` and `npx eslint src`.
