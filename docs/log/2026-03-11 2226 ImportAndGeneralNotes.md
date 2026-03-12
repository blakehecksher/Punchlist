# 2026-03-11 2226 ImportAndGeneralNotes

## TL;DR
- What changed: Fixed the empty General Notes dead-end, added an import drawer for pasted or uploaded `.md` / `.txt` punchlist notes, and merged imported room items into matching rooms by normalized room name.
- Why: Deleting all general notes removed the only way to add them back, and the live GitHub Pages build needs a fast way to populate notes from structured text.
- What didn't work: `npm run lint` failed on the legacy [PunchList_925Park.jsx](/c:/Users/blake/OneDrive%20-%20John%20B.%20Murray%20Architect/0001%20Office/Program%20Playground/Punchlist/PunchList_925Park.jsx) file, which is outside the current app path and still has pre-existing React hook/compiler issues.
- Next: Verify the new import format against real field notes, decide whether a destructive "replace existing notes" mode is worth adding, and clean up the legacy lint blocker if that file still matters.

---

## Full notes

- `src/pagination.js` now always emits a General Notes section, even when there are zero general notes. The screen view keeps the entry point visible; print hides the empty header so blank notes do not show in the PDF.
- `src/PunchListApp.jsx` now keeps General Notes recoverable via an always-available `Add note` affordance and adds an import drawer with:
  - paste support
  - `.md` / `.txt` file loading
  - inline formatting guidance
  - a sample template
  - a chatbot-formatting tip
- `src/importParser.js` accepts a simple structure:
  - room headings such as `## 305 Kitchen` or `305 Kitchen:`
  - bullet or numbered items under each heading
  - an optional `General Notes` heading
- Import behavior is append-only for safety:
  - imported general notes append to the General Notes section
  - imported room items append to an existing room if the room name matches after whitespace normalization
  - otherwise a new room is created
- Verification:
  - `npm run build` passed
  - `npm.cmd run lint` failed because of existing issues in `PunchList_925Park.jsx`, not because of the new changes
