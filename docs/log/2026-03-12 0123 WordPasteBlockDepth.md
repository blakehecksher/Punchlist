# 2026-03-12 0123 WordPasteBlockDepth

## TL;DR
- What changed: Replaced the Word paste depth fallback that grouped by parsed list IDs with a document-order block-based depth normalization.
- Why: The browser was clearly exposing HTML, but nesting was still collapsing, which suggested Word’s list identifiers were not stable enough to infer hierarchy.
- What didn't work: This still has not been validated against a live Word clipboard sample from the target browser.
- Next: Re-test the same paste input. If depth still collapses, inspect the real clipboard HTML instead of guessing further.

---

## Full notes

- Updated `src/importHtml.js`:
  - removed the per-list-ID grouping fallback
  - added `applyWordListDepths(...)` to normalize a contiguous block of `wordList` entries together
  - `normalizeWordListDepths(...)` now walks the parsed entry stream in document order and flushes depth calculations whenever a non-Word-list entry interrupts the block
- Depth rules now work like this for each contiguous Word list block:
  - if explicit nested `levelN` markers exist, use them
  - otherwise, sort distinct `margin-left` values across the whole block and map them to depth `0..n`
- This is more robust when Word clipboard HTML emits inconsistent list IDs across related bullets but still preserves indentation through margins.
- Verification completed this session:
  - `npm run build`
- Verification still needed:
  - a live nested Word paste in the target browser
  - inspection of a real clipboard HTML sample if depth is still flat
