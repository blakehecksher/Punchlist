# State
_Last updated: 2026-03-11_

## Current focus
Live-site polish after GitHub Pages deployment: recoverable General Notes and bulk text import.

## What's working
- `npm run dev` → http://localhost:5173 (or next available port)
- Pushes to `master` build and deploy via `.github/workflows/deploy.yml`
- Pages are fixed 11×8.5in landscape on screen and in print
- Pagination: max 2 rows (4 items) per page, page 1 and all others
- Row height equalization: item-rows are direct flex children of page-content (flat structure)
- Single-item rooms pair side-by-side with half-width headers
- Multi-item rooms get full-width headers with paired item rows
- 3-item rooms stay together on one page (no unnecessary cont'd split)
- Trailing odd items from multi-item rooms buffer and pair with next single-item room
- Room headers repeat with `(cont'd)` on continuation pages
- General Notes header repeats with `(cont'd)` on continuation pages
- Half-width headers for single trailing items (GN and rooms)
- All text editable inline (project, proj#, date, title, room names, items)
- Empty item slots are invisible (no fill, no border)
- Photo upload with compression (max 1200px, JPEG quality 0.7)
- Photo pan/zoom: drag to reposition in both axes, scroll wheel to zoom, works with any aspect ratio
- Drag continues outside photo cell boundary until mouse release (window-level listeners)
- Photo position persistence: pan/zoom saved to IndexedDB alongside photo data
- Backward-compatible with legacy photo data (plain dataUrl strings)
- localStorage (text) + IndexedDB (photos + positions) persistence
- Codebase split into 7 focused modules with useReducer state management
- General Notes section stays reachable even after all notes are deleted
- Import drawer accepts pasted or uploaded markdown/plain text punchlist notes and appends them into General Notes and rooms
- Importer understands nested bullet or numbered outlines from field notes, ignores `Site Conditions`, and flattens nested sub-bullets into item text
- Document header uses a centered bold title, stacked project/project-number lines, and a clearer print/PDF icon
- Date field defaults to the current date each time the app is opened, while remaining editable
- Seed data is now neutral example content instead of job-specific project data
- Empty description fields show helper placeholder text, and delete affordances are more visible on hover
- `npm run build` passes

## Known issues
- `npm.cmd run lint` fails on legacy `PunchList_925Park.jsx` due pre-existing React hook/compiler issues outside the current `src/` app path.

## Next actions
1. Test the import parser with more real field-note samples and tune room-name normalization if needed
2. Decide whether existing browser-saved data should keep overriding the neutral seed state or whether a reset action is needed
3. Decide whether import should stay append-only or also support a destructive replace mode

## How to verify
```
cd "c:/Users/blake/OneDrive - John B. Murray Architect/0001 Office/Program Playground/Punchlist"
npm run dev
# open http://localhost:5173
# remove all General Notes and confirm "General Notes" + "Add note" remain on screen
# open Import Notes and paste:
# ## General Notes
# - Check hardware alignment
#
# ## 305 Kitchen
# - Install missing grille
# confirm the notes append correctly
npm run build
```

## Recent logs
- docs/log/2026-03-11 2306 SeedDataAndAffordances.md — replaced seed data with neutral examples and improved placeholders/remove affordances
- docs/log/2026-03-11 2254 HeaderDateIcon.md — centered the title, switched date default to current day, replaced print glyph
- docs/log/2026-03-11 2242 OutlineImport.md — importer now accepts nested bullet/numbered field-note outlines
- docs/log/2026-03-11 2226 ImportAndGeneralNotes.md — fixed empty General Notes dead-end and added markdown/plain-text import
- docs/log/2026-03-11 0000 Kickoff.md — Vite scaffold, localStorage + IndexedDB wiring
- docs/log/2026-03-11 0100 Pagination.md — fixed page layout, row height, multi-room packing
- docs/log/2026-03-11 0200 RowHeight.md — attempted flex fix, root cause isolated
- docs/log/2026-03-11 0300 LayoutAndPhotos.md — 2x2 grid layout, single-room pairing, photo compression
- docs/log/2026-03-11 1900 Refactor.md — module extraction, photo pan/zoom fix, useReducer
- docs/log/2026-03-11 2000 PhotoPolish.md — background-image approach, window-level drag, both-axis pan
