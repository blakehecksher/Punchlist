# 2026-03-12 0114 WordPasteDepthFallback

## TL;DR
- What changed: Added a fallback that derives Word paste indentation depth from `margin-left` when clipboard HTML list level markers are missing or flat.
- Why: Structured Word paste was preserving bullets but not grouping because every pasted list paragraph was landing at depth `0`.
- What didn't work: I still have not validated this against a live Word paste in the browser; this was implemented from Word HTML heuristics.
- Next: Re-test nested Word paste, then tune the heuristic if a real clipboard sample still collapses depth.

---

## Full notes

- Updated `src/importHtml.js`:
  - `getWordListDepth(...)` now returns `null` when Word does not expose a usable `levelN` marker
  - added `getWordListId(...)` and `getWordListMarginLeft(...)`
  - added `normalizeWordListDepths(...)` to post-process all `wordList` entries after parsing
- Depth normalization now works as follows:
  - if any entry in a Word list group has an explicit nested level, use those explicit levels
  - otherwise, sort the distinct `margin-left` values inside that list group and map them to depth `0..n`
- This keeps top-level bullets top-level while allowing nested Word bullets to become indented bullets even when Word clipboard HTML does not emit reliable list levels.
- Verification completed this session:
  - `npm run build`
- Verification still needed:
  - live Word paste test with nested bullets
  - confirmation that multiple separate list groups in one paste still map cleanly
