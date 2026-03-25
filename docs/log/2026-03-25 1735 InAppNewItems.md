# 2026-03-25 1735 InAppNewItems

## TL;DR
- What changed: Manually added general notes, room items, and the starter item in a new room now set `isNew` immediately.
- Why: In-app additions should behave like externally imported new items, including summary counts and underlined issue numbers.
- What didn't work: No browser-only validation was run for the add-item flows.
- Next: Manually confirm in the UI that adding items in-app increments the `new` summary count and underlines the issue number everywhere it appears.

---

## Full notes

- Updated `makeRoom(...)` so the first item created with a brand-new room is built with `makeItem(firstDescription, 1, true)`.
- Updated the reducer `addGeneralNote` branch to create `makeItem("", nextIssueSeq, true)`.
- Updated the reducer `addRoomItem` branch to create `makeItem("", nextIssueSeq, true)`.
- This keeps manual additions aligned with the existing `isNew` export/import and styling pipeline, so no separate UI-only logic is needed for counts or issue-code underline rendering.
- Verified with `npx.cmd eslint src` and `npm.cmd run build`.
