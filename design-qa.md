# Design QA

## Evidence
- Source visual truth: `docs/design/2026-08-06-end-reference.png`
- Initial implementation: `docs/design/2026-08-06-end-implementation-before.png`
- Final implementation: `docs/design/2026-08-06-end-implementation.png`
- Same-frame comparison: `docs/design/2026-08-06-end-comparison.png`
- Source pixels: 1008 x 393.
- Implementation pixels and CSS viewport: 1265 x 712 at device density 1.
- Normalization: both captures were proportionally fit to 900-pixel comparison panels without cropping.
- State: final detail page with two saved issuance records; screen-only editing controls remain visible outside the print area.

## Findings
- P0 blockers: 0.
- P1 major mismatches: 0.
- P2 material mismatches: 0.
- P3 polish: the live implementation retains the product's established document typefaces and lighter gray rule rather than treating the orange markup in the source as visual styling. This is intentional; the markup describes placement only.

## Required fidelity surfaces
- Fonts and typography: the existing Inter heading and Source Serif issuance line preserve the document system. Weight, case, and hierarchy remain readable at print scale.
- Spacing and layout rhythm: the record now begins at the top-left of its reserved row, the rule spans the complete inner width, and issuance lines use a consistent 24-pixel indent. Ten entries fill the first column before a second column begins.
- Colors and visual tokens: the existing ink, muted rule, paper, and border colors remain unchanged and meet the monochrome document language.
- Image quality and assets: this component contains no raster imagery, logos, or custom icon assets. No placeholders or approximated assets were introduced.
- Copy and content: `End of Punch List` and the issued title/date format match the requested document language.

## Interaction review
- GEN and EXT item prefixes render in the live document.
- A clean first import reports zero new items, while later-issuance imports can still mark new work.
- Formatted General and Exterior headings parse as section names instead of becoming malformed rooms.
- Multi-item formatting no longer rejects a selection containing line breaks, and serialized formatting is balanced per line so bullets remain parseable.
- The `Show issuances` checkbox hides the dated print-history lines while preserving the `End of Punch List` title and the screen-only Issuances workspace.
- The ending follows the last item row with no automatic top margin, so a new ending-only page starts in its first row rather than its second.
- Browser console errors: none.
- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.

## Comparison history
1. Initial P2: the issuance record was centered vertically and horizontally, with a short centered rule. This contradicted the annotated source's top-left placement and full-width line.
2. Fix: changed the record to top-left alignment, extended the rule across the container, indented the issuance entries, and split history into columns of ten.
3. Post-fix evidence: `docs/design/2026-08-06-end-comparison.png` shows the requested placement, width, and hierarchy with no remaining P0/P1/P2 mismatch.
4. Follow-up comparison against the annotated blank-row screenshot confirmed the ending now occupies the next available row instead of being pushed to the page bottom.

## Implementation checklist
- [x] Top-left document ending.
- [x] Full-width rule.
- [x] Indented issuance entries.
- [x] Two-column capacity for twenty issuances.
- [x] Existing print geometry preserved.
- [x] Optional dated issuance lines with persistent default-on behavior.
- [x] Natural next-row placement without bottom pinning.

final result: passed
