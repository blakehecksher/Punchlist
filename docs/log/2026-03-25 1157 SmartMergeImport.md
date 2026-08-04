# 2026-03-25 1157 SmartMergeImport

## TL;DR
- What changed: the importer now parses issue codes into structured items, the app now supports `Merge` versus `Append` import modes, and merge-mode imports update matching coded items in place instead of recreating them.
- Why: photos are keyed by `projectId:itemId`, so preserving the original item ID on re-import keeps existing photo attachments intact.
- What didn't work: browser-level validation with a real project and actual attached photos was not run from the terminal session.
- Next: run merge-mode and append-mode imports against a real exported project to confirm photo persistence, site-condition replacement, and additive append behavior.

---

## Full notes

- Updated `src/importParser.js` so General Notes and room items now parse as `{ issueCode, description }` objects instead of raw strings.
- Normalized captured codes to the same uppercase, zero-padded format used by `formatIssueCode(...)`.
- Preserved markdown wrappers when stripping codes so inputs like `~~GN-05: ...~~` still merge correctly and keep their strikethrough formatting after import.
- Updated the existing `importNotes` reducer path so append mode still works with the new structured parser output.
- Added a new `mergeNotes` reducer path in `src/PunchListApp.jsx` that:
  - replaces Site Conditions,
  - matches General Notes by `GN-##`,
  - matches room items by room name plus issue code,
  - preserves matched item `id`, `photo`, `photoPosition`, and `issueSeq`,
  - adds uncoded or unmatched imported items as new entries,
  - leaves untouched existing rooms/items in place.
- Added a `Merge` / `Append` toggle plus helper copy to the import panel and added merge-specific import status text.
- Added styles in `src/styles.css` for the new segmented import-mode control.
- Verified locally with:
  - `npx.cmd eslint src`
  - `npm.cmd run build`
- Ran a parser smoke test in Node to confirm issue-code extraction and strikethrough preservation for flattened imported notes.
