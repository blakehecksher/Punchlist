# 2026-03-12 0010 ImportPanelFit

## TL;DR
- What changed: Constrained the import drawer to the viewport, made the panel body scrollable, and reduced the prompt/text box heights so the popup fits on screen.
- Why: The import popup was exceeding the page height and obscuring the main UI instead of behaving like a contained utility drawer.
- What didn't work: No new blocker in the active app path.
- Next: Spot-check the drawer on a smaller laptop viewport to confirm the new max-height still feels balanced.

---

## Full notes

- `src/styles.css` now gives `.import-panel` a viewport-based `max-height`, uses a flex column layout, and hides overflow at the panel shell.
- `.import-panel-body` now scrolls vertically when content exceeds the available space.
- `.import-prompt` now uses a fixed max height with its own scrollbar.
- `.import-textarea` was reduced so the main input remains visible without forcing the whole drawer off-screen.
- Verification:
  - `npm run build` passed
