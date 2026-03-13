# State
_Last updated: 2026-03-13_

## Current focus
Validate the summary-first document flow with real projects, especially repaired issue numbering, room-number sorting, clipboard note copy, editable summary descriptions, refined multi-line summary pagination, and final summary grid polish, then decide on the end-of-list note / disclaimer.

## What's working
- `npm run dev` serves the app locally
- Pushes to `master` build and deploy via `.github/workflows/deploy.yml`
- The punch list editor, import flow, photo handling, local persistence, and density controls are working
- Existing projects backfill missing or duplicated issue-sequence data on load, and new General Notes / room items continue numbering from the highest existing issue code
- The document renders summary pages first and detailed photo/grid pages second
- Summary copy now uses `Summary` with a plain item count
- Summary rows now give more width to `Description`, wrap long summary text, allocate extra row height more conservatively for longer descriptions, and keep the summary grid lines continuous across the row height
- Summary descriptions are directly editable and update the same underlying item shown in the detailed photo/grid page
- Rooms can be explicitly sorted from the sidebar by extracted room number without auto-reordering during typing
- Notes can be copied to the clipboard as an import-friendly outline with issue codes, and the importer strips those issue-code prefixes on re-import
- `npm run build` passes and `npx eslint src` passes

## In progress
- Manual browser and print/PDF review of summary pages with real project content
- Manual testing of clipboard note copy and re-import with real notes
- Deciding the final wording and placement for an end-of-punch-list note / disclaimer

## Known issues
- `npm.cmd run lint` still fails on legacy `PunchList_925Park.jsx` issues outside the current `src/` app path
- Summary pages and dense detailed layouts still need broader real-project validation in the browser and print preview
- Word import validation against real `.docx` exports is still pending

## Next actions
1. Reload an existing project that already showed duplicate `GN-01` / `GN-02` codes and confirm the loader repairs them.
2. Test `Sort Rooms` on a mixed room list and confirm rooms sort by room number, with General remaining first.
3. Edit a long summary description, confirm the detailed photo card updates immediately, then use `Copy Notes` and re-import that outline into a blank project to confirm descriptions stay clean.

## How to verify
```bash
cd "c:/Users/blake/OneDrive - John B. Murray Architect/0001 Office/Program Playground/Punchlist"
npm run dev
# open http://localhost:5173
# reload a project with older numbering data and confirm new notes continue at the next available GN / room code
# confirm the summary header says "Summary" and the count says "N items"
# confirm long summary descriptions wrap cleanly, gain modest extra row height, and can be edited directly in the summary row
# confirm summary grid borders stay continuous on both sides of the item-code column
# confirm editing a summary description immediately updates the matching detailed card
# use the sidebar Sort Rooms button and confirm rooms reorder by room number only when the button is clicked
# use Copy Notes, paste the outline elsewhere, then import it into a blank project and confirm descriptions do not include duplicated issue-code prefixes
# print to PDF and compare summary pages plus detailed pages against the on-screen layout
npm run build
npx eslint src
```

## Recent logs
- docs/log/2026-03-13 0113 SummaryGridBorders.md - fixed summary row alignment so vertical grid borders span the full row height
- docs/log/2026-03-13 0108 SummaryPaginationTuning.md - reduced the aggressiveness of multiline summary row allocation
- docs/log/2026-03-13 0103 SummaryMultilinePagination.md - made summary pagination allocate extra row height for long descriptions
