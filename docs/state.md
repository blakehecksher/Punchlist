# State
_Last updated: 2026-03-13_

## Current focus
Validate the simplified summary layout on real projects, especially the new summary toggle, natural auto-height summary rows, and no-filler summary pages, then decide on the final end-of-list note / disclaimer.

## What's working
- `npm run dev` serves the app locally
- Pushes to `master` build and deploy via `.github/workflows/deploy.yml`
- The punch list editor, import flow, photo handling, local persistence, density controls, and per-project layout settings are working
- Existing projects backfill missing or duplicated issue-sequence data on load, and new General Notes / room items continue numbering from the highest existing issue code
- The sidebar now exposes independent `Show photos` and `Summary` checkboxes
- When `Summary` is on, the document renders summary pages first and detailed photo/grid pages second
- When `Summary` is off, the document skips the summary section entirely and starts with the detailed pages again
- Summary copy uses `Summary` with a plain item count, keeps the grid lines continuous, allows direct description editing, lets each description row grow from the actual text height instead of a fixed visual span, and ends the table at the last real item instead of rendering blank filler rows
- Rooms can be explicitly sorted from the sidebar by extracted room number without auto-reordering during typing
- Notes can be copied to the clipboard as an import-friendly outline with issue codes, and the importer strips that prefix back off on re-import
- `npm.cmd run build` passes and `npx.cmd eslint src` passes

## In progress
- Manual browser and print/PDF review of summary-on versus summary-off output with real project content
- Manual validation that wrapped summary rows like `300-01` size naturally without excess dead space
- Manual validation that later summary pages stop cleanly at the last real row with no leftover filler-row border artifacts
- Manual testing of clipboard note copy and re-import with real notes
- Deciding the final wording and placement for an end-of-punch-list note / disclaimer

## Known issues
- `npm.cmd run lint` still fails on legacy `PunchList_925Park.jsx` issues outside the current `src/` app path
- Summary pages and dense detailed layouts still need broader real-project validation in the browser and print preview
- Word import validation against real `.docx` exports is still pending

## Next actions
1. Open a real project and confirm wrapped summary rows like `300-01` now collapse to the text height without the earlier extra blank space.
2. Check a second summary page and confirm the table ends immediately after the last real item with no blank filler rows or lower border artifacts.
3. Toggle `Summary` off and back on, then print to PDF and compare the first page composition plus wrapped summary rows in both modes.

## How to verify
```bash
cd "c:/Users/blakeh/OneDrive - John B. Murray Architect/0001 Office/Program Playground/Punchlist"
npm.cmd run dev
# open http://localhost:5173
# in the sidebar Layout section, toggle Summary off and confirm all summary pages disappear
# confirm the first remaining document page shows Site Conditions above the detailed grid when Summary is off
# toggle Summary back on and confirm summary pages return ahead of the detailed pages
# confirm the checkbox state persists after reload for the active project
# confirm summary descriptions still edit the matching detailed card when Summary is on
# confirm a wrapped item like 300-01 grows only as much as the actual text needs
# confirm the summary table ends after the last real row on each summary page with no filler-row border artifacts
# use Sort Rooms and Copy Notes as before to confirm those flows still work
npx.cmd eslint src
npm.cmd run build
```

## Recent logs
- docs/log/2026-03-13 1153 SummaryNoFillers.md - removed blank filler rows from summary pages so the table ends at the last real item
- docs/log/2026-03-13 1138 SummaryTableCleanup.md - removed summary table stretching and restored empty-row column borders
- docs/log/2026-03-13 1119 SummaryAutoHeight.md - simplified summary rows so description cells grow from actual text height
- docs/log/2026-03-13 1104 SummarySidebarToggle.md - added a sidebar summary toggle that removes summary pages when disabled
- docs/log/2026-03-13 0113 SummaryGridBorders.md - fixed summary row alignment so vertical grid borders span the full row height
- docs/log/2026-03-13 0108 SummaryPaginationTuning.md - reduced the aggressiveness of multiline summary row allocation
