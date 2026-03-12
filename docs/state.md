# State
_Last updated: 2026-03-12_

## Current focus
Keep `.docx` import as the primary office workflow and validate it against real project files.

## What's working
- `npm run dev` serves the app locally
- Pushes to `master` build and deploy via `.github/workflows/deploy.yml`
- The punch list editor, pagination, print/PDF flow, photo handling, and local persistence are working
- General Notes stays accessible even when all notes are deleted
- The import drawer accepts pasted text and uploaded `.md`, `.txt`, and `.docx` files
- `.docx` upload uses `mammoth.convertToHtml(...)` and normalizes Word list / heading HTML into the dash-bullet outline that `src/importParser.js` understands
- The parser can map `Site Conditions`, `General Notes`, and room sections when the input contains visible bullets, numbering, or heading lines
- The import drawer includes a clearer chatbot prompt and copy-to-clipboard action
- `npm run build` passes

## In progress
- Verifying the `.docx` normalization against actual office Word exports

## Known issues
- Word clipboard handling remains inconsistent for nested hierarchy, so file import is the preferred workflow
- The HTML-to-outline normalizer still uses heading heuristics for short paragraphs followed by lists, so it needs validation against real staff-authored documents
- `npm.cmd run lint` still fails on legacy `PunchList_925Park.jsx` issues outside the current `src/` app path

## Next actions
1. Test several real office `.docx` files with Site Conditions, General Notes, rooms, and nested bullets.
2. Confirm the imported outline matches the visible Word structure closely enough for staff workflow.
3. Revisit direct Word paste only if it becomes necessary again.

## How to verify
```bash
cd "c:/Users/blake/OneDrive - John B. Murray Architect/0001 Office/Program Playground/Punchlist"
npm run dev
# open http://localhost:5173
# confirm normal editing / print flows still work
# load a real .docx file and confirm the textarea shows a readable dash-bullet outline
# import the result and confirm Site Conditions, General Notes, rooms, and nested items land in the expected sections
npm run build
```

## Recent logs
- docs/log/2026-03-12 0129 RemoveClipboardButton.md — removed the direct clipboard-read button and returned the import drawer to the file-import-first workflow
- docs/log/2026-03-12 0127 WordPasteMarkerIndent.md — added a final Word clipboard depth fallback based on hidden marker-span spacing
- docs/log/2026-03-12 0123 WordPasteBlockDepth.md — replaced per-list depth fallback with contiguous block indentation normalization for Word clipboard HTML
- docs/log/2026-03-12 0118 ClipboardReadFallback.md — added a direct clipboard-read import path that prefers HTML and reports when only flat text is available
- docs/log/2026-03-12 0114 WordPasteDepthFallback.md — added a margin-left fallback for Word clipboard list depth when list level markers are unreliable
- docs/log/2026-03-12 0109 WordPasteOutlineImport.md — added rich HTML paste handling for Word so structured paste is normalized before the browser flattens it
- docs/log/2026-03-12 0055 WordDocxOutlineImport.md — replaced raw `.docx` extraction with HTML-to-outline normalization and documented the remaining validation work
