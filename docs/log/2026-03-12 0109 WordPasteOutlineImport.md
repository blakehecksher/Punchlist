# 2026-03-12 0109 WordPasteOutlineImport

## TL;DR
- What changed: Added a rich paste handler on the import textarea so Word clipboard HTML is converted into the same dash-bullet outline format used by the file importer.
- Why: The `.docx` upload path was fixed, but direct paste from Word still let the browser collapse list structure into flat plain text before parsing.
- What didn't work: This still depends on the browser exposing `text/html` in the clipboard payload, and I did not verify against a live Word paste in-browser during this session.
- Next: Test actual Word clipboard behavior in the browser the office uses, then tune any list-marker or heading heuristics that fail on real notes.

---

## Full notes

- Expanded `src/importHtml.js` so it now supports two HTML shapes:
  - clean list / heading HTML such as the Mammoth `.docx` conversion output
  - Word clipboard HTML where bullets are represented as `MsoListParagraph` paragraphs with `mso-list` styles instead of semantic `<ul>/<ol>` lists
- Added `hasStructuredImportHtml(...)` so the app only intercepts paste when the clipboard HTML actually looks like a structured outline.
- Added `handleImportPaste` in `src/PunchListApp.jsx`:
  - reads `text/html` from the clipboard
  - converts structured HTML into normalized import text
  - prevents the browser default paste so Word bullets are not flattened first
  - inserts the converted outline at the current textarea selection and shows a review message
- Left normal plain-text paste alone when there is no structured HTML payload.
- Verification completed this session:
  - `npm run build`
- Verification still needed:
  - real Microsoft Word paste tests in the target browser
  - validation that nested bullets and section headings round-trip cleanly for staff-authored notes
