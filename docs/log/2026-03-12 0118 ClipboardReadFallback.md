# 2026-03-12 0118 ClipboardReadFallback

## TL;DR
- What changed: Added a `Paste From Clipboard` action that reads clipboard contents directly, prefers rich HTML, and reports when only flat plain text is available.
- Why: The paste event path still was not fixing the user’s Word workflow, so the next practical step was to bypass the normal paste path and ask the browser for clipboard data directly.
- What didn't work: I still have not verified which clipboard types the target browser exposes for a live Word copy.
- Next: Test the new button and use its status message to determine whether the remaining problem is missing HTML data or incorrect HTML normalization.

---

## Full notes

- Updated `src/PunchListApp.jsx`:
  - added `handlePasteFromClipboard`
  - prefers `navigator.clipboard.read()` when available
  - falls back to `navigator.clipboard.readText()` when only plain-text access is supported
  - prefers `text/html` over `text/plain`
  - uses the same HTML normalization path as `.docx` upload and rich paste
- Added a new `Paste From Clipboard` button to the import drawer.
- The button now provides more useful status outcomes:
  - `Clipboard HTML converted to outline...`
  - `Clipboard only exposed flat text for this content...`
  - `Clipboard did not contain importable text.`
- This should make the next user test actionable by telling us whether the browser is actually providing structure to the app.
- Verification completed this session:
  - `npm run build`
- Verification still needed:
  - test the button with a live Word copy in the target browser
  - if flat text is still the only available format, capture a real clipboard sample or adjust workflow expectations
