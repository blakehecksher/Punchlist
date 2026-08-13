# Design QA — Living Punch List Notes

## Evidence

- Source visual truth: `docs/design/2026-08-13-meta-list-option-3.png`
- Initial implementation: `docs/design/2026-08-13-meta-list-implementation.png`
- Final implementation: `docs/design/2026-08-13-meta-list-implementation-final.png`
- Final normalized comparison: `docs/design/2026-08-13-meta-list-qa-comparison-final.png`
- Responsive implementation: `docs/design/2026-08-13-meta-list-responsive.png`
- State: example project, Punch List Notes open, first document page visible
- CSS viewport: 1440 × 1092 at device pixel ratio 1
- Source pixels: 1440 × 1092
- Browser implementation pixels: 1425 × 1081 because the captured browser content excludes its 15 px scrollbar gutter and 11 px browser chrome inset
- Density normalization: both halves of the comparison were rendered at 1425 × 1081 with high-quality bicubic resampling

## Full-view comparison

The selected layout is present: the existing paginated punch-list/photo document remains central, and a full-height right panel contains the live label, compact editing controls, continuous monospace outline, keyboard helper, file/paste actions, and save state. Panel proportions, monochrome palette, borders, typography hierarchy, and document/panel balance follow the selected direction.

The source uses condensed illustrative list content while the implementation shows the complete real example fixture and its canonical stable codes. The existing app header, example banner, and central document were intentionally preserved because the selected product direction changes only the right-side editor.

## Focused-region comparison

A separate crop was not needed. The right panel occupies roughly one third of the original-pixel comparison and its header, toolbar, outline, helper, footer buttons, and save status are all legible. The responsive capture separately verifies the same panel at a 700 × 900 viewport.

## Required fidelity surfaces

- Fonts and typography: existing sans-serif UI and serif document typography remain unchanged; the new outline uses a compact Courier-style monospace treatment matching the visual target. Weights, casing, line height, and helper hierarchy are consistent.
- Spacing and layout rhythm: panel header, toolbar groups, editor, helper, and footer use the target's compact stacked rhythm. The center document remains usable and the panel becomes an overlay at narrower widths.
- Colors and visual tokens: the implementation reuses the app's warm white, gray, ink, border, and shadow tokens. No new competing palette or gradient was introduced.
- Image quality and asset fidelity: the direction contains no new raster imagery. Existing photo cells and app icons remain unchanged and sharp.
- Copy and content: Import Notes is now Punch List Notes; the panel explicitly says it is live and that room headings and indented items control document structure. Actions read Load notes file and Paste from Word.

## Comparison history

### Iteration 1

- [P2] Footer actions were stretched across the whole panel and the save state sat above the footer instead of sharing its baseline.
- Fix: moved the live save state into the footer and gave both actions compact target-sized widths, with stacked responsive behavior below 720 px.
- Post-fix evidence: `docs/design/2026-08-13-meta-list-implementation-final.png` and `docs/design/2026-08-13-meta-list-qa-comparison-final.png`.

No P0 or P1 findings were present.

## Interaction and runtime checks

- Opened, closed, and reopened Punch List Notes from the top toolbar.
- Replaced the example outline with a two-item room outline; the document created the room and assigned `101-01` and `101-02` automatically.
- Edited an item in the central document; the change mirrored back into the outline.
- Verified the panel and both footer actions remain visible at 700 × 900.
- Checked browser console errors after the desktop and responsive passes: none.

## Follow-up polish

- [P3] The implementation keeps plain-text Undo, Redo, Outdent, and Indent labels instead of introducing a new icon dependency for the mock's icon-only controls. The labels are clearer and preserve the existing app's restrained control language.

## Final result

final result: passed
