# 2026-03-13 0043 CopyNotesAndRoomNumberSort

## TL;DR
- What changed: Replaced file-based note export with clipboard copy and changed manual room sorting to use extracted room number instead of the full room-name string.
- Why: Live use made it clear that copying outline text is faster than downloading a markdown file, and room ordering needed to follow room number rather than alphabetic title.
- What didn't work: The first sort pass relied on `localeCompare(..., { numeric: true })` over the whole room name, which still produced the wrong order for names where the descriptive text affected comparison.
- Next: Test `Copy Notes` in the browser and confirm room-number sorting behaves correctly on a mixed real-world room list.

---

## Full notes

- Replaced the file-download helper with clipboard-copy logic in `src/exportNotes.js`, including an `execCommand("copy")` fallback when the async clipboard API is unavailable.
- Renamed the toolbar action from `Export Notes` to `Copy Notes` and updated the save-status feedback to `Notes copied` / `Copy failed`.
- Updated room sorting so it extracts the numeric room prefix used by issue codes and sorts rooms by that number first, then uses the room name only as a tie-breaker.
- Left General Notes behavior unchanged; only room sections participate in the manual sort action.
- Re-verified with `npm run build` and `npx eslint src`.
