# 2026-03-12 0127 WordPasteMarkerIndent

## TL;DR
- What changed: Added a third depth fallback for Word clipboard HTML based on spacing stored inside hidden `mso-list:Ignore` marker spans.
- Why: The browser was exposing HTML, but both explicit Word list levels and visible paragraph indentation still were not enough to recover nesting from the user’s clipboard content.
- What didn't work: This is still heuristic until validated against the exact clipboard HTML from the target browser and Word combination.
- Next: Re-test the same Word paste. If depth is still flat, stop guessing and inspect the actual clipboard HTML sample.

---

## Full notes

- Updated `src/importHtml.js`:
  - added `getWordListMarkerIndent(...)`
  - this inspects hidden Word marker spans with `mso-list:Ignore`
  - it counts spacing and `mso-tab-count` values after stripping the bullet/number marker itself
- `applyWordListDepths(...)` now resolves nested depth in this order:
  - explicit `levelN`
  - distinct `margin-left` values
  - distinct hidden marker-spacing values
  - fallback to depth `0`
- This should cover another common Word clipboard variant where the visual nesting is preserved in hidden marker spacing rather than paragraph margin differences.
- Verification completed this session:
  - `npm run build`
- Verification still needed:
  - live nested Word paste in the target browser
  - clipboard HTML inspection if nesting is still lost
