# 2026-08-13 0842 Living punch list notes implementation

## TL;DR
- What changed: Turned the right-side Import Notes form into a persistent Punch List Notes outline that controls and mirrors the existing punch-list/photo document.
- Why: The first Word paste should remain easy, but the app itself needs to be the obvious place to maintain every later punch list.
- What didn't work: The first visual pass put the save state outside the footer; visual QA caught and corrected it. Browser caret automation could not reliably place a cursor inside contenteditable text, so Enter behavior was hardened with explicit line-break insertion and caret-preservation logic while live sync was verified through full outline editing.
- Next: Validate the workflow with representative real Word notes and decide how much issuance complexity still belongs in the core app.

---

## Full notes

- Renamed the top action and panel from Import Notes to Punch List Notes.
- Kept the middle paginated photo document and all of its existing editing, photo, printing, and issuance controls.
- Made the outline autosave after a short delay and display a live save state.
- Made the outline authoritative for room/item order and removal while keeping the document bidirectionally synchronized.
- Added stable-code reconciliation so existing IDs, photos, crop positions, and never-reused per-section numbering survive outline changes.
- Added room-rename detection and safe item moves between rooms.
- Added Enter continuation, Tab/Shift+Tab indentation, toolbar indentation/history actions, and caret preservation when automatic numbers are written back into the outline.
- Retained Word, Markdown, and text file loading and added a Paste from Word action.
- Updated help copy to teach the living-outline workflow.
- Removed the obsolete one-time merge/import reducer path.
- Added four outline model regression tests covering order, removals, numbering, room renames, item moves, photo preservation, and post-issuance new markers.
- Verified desktop and 700 px responsive layouts against the selected option-3 image; design QA passed.
- Verified 16 tests, lint, production build, two-way synchronization, panel open/close behavior, responsive controls, and zero browser console errors.
