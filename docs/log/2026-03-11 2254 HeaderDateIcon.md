# 2026-03-11 2254 HeaderDateIcon

## TL;DR
- What changed: Centered and bolded the Punchlist title, made the default date resolve to the current date on load, and replaced the unclear print glyph with a document icon.
- Why: The header title was visually drifting because the left block was not stacked cleanly, the date needed to default to "today" for each session, and the print button needed a clearer affordance.
- What didn't work: No new blocker in the active app path; legacy lint issues outside `src/` still remain.
- Next: Spot-check the header visually with a few longer project names and titles to make sure the fixed title width still feels right.

---

## Full notes

- `src/styles.css` now uses a three-column grid for the document header, stacks project and project number vertically on the left, centers the title column, and bolds the title input.
- `src/PunchListApp.jsx` now uses a `getCurrentDateLabel()` helper for the initial state and for restored sessions, so opening the app resets the date field to the current date while keeping it editable afterward.
- The print button now uses an inline document icon instead of the old glyph. The icon choice was based on the open-source Lucide document/file style, but implemented inline to avoid adding a dependency.
- Verification:
  - `npm run build` passed
