# 2026-03-12 0055 WordDocxOutlineImport

## TL;DR
- What changed: Replaced raw `.docx` extraction with a Mammoth HTML conversion path that normalizes Word headings and nested lists into the plain dash-bullet outline used by the existing importer.
- Why: Word stores bullets and hierarchy as document structure, so `extractRawText(...)` was discarding the exact metadata the punch list parser needs.
- What didn't work: I did not verify against a real office-authored `.docx` in-browser yet, and direct paste from Word into the plain textarea is still a separate unresolved path.
- Next: Test real documents, tune any heading heuristics that misclassify sections, and decide whether to normalize clipboard HTML on paste too.

---

## Full notes

- Added `src/importHtml.js` to convert Mammoth HTML fragments into import-ready text:
  - ordered and unordered lists become dash bullets
  - nested Word lists become indented nested bullets
  - heading tags, plus short paragraphs immediately followed by lists, are normalized into `Section:` lines so `src/importParser.js` can keep using its heading mode
- Updated `src/importFile.js` so `.docx` uploads call `mammoth.convertToHtml(...)` instead of `mammoth.extractRawText(...)`, then pass the HTML through the new normalizer before showing it in the import textarea.
- Kept the existing text parser in place. The strategy here is to recover Word structure upstream and feed the parser the same plain outline format it already handles for `.md`, `.txt`, and cleaned pasted text.
- Updated the empty-import error copy to mention `.docx`, and changed the file-load status to tell the user they are reviewing an outline.
- Verification completed this session:
  - `npm run build`
- Verification still needed:
  - upload real office `.docx` files through the app and compare the resulting outline against the visible Word list structure
  - confirm the short-heading heuristic behaves correctly for actual staff formatting patterns
