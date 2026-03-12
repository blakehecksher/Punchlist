# State
_Last updated: 2026-03-11_

## Current focus
Stable. Refactor complete, photo pan/zoom working in all directions.

## What's working
- `npm run dev` → http://localhost:5173 (or next available port)
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
- Build and lint clean (zero errors/warnings)

## Known issues
None currently blocking.

## Next actions
1. Verify print output matches screen with repositioned photos
2. Consider export/import JSON for backup

## How to verify
```
cd "c:/Users/blake/OneDrive - John B. Murray Architect/0001 Office/Program Playground/Punchlist"
npm run dev
# open http://localhost:5173
```

## Recent logs
- docs/log/2026-03-11 0000 Kickoff.md — Vite scaffold, localStorage + IndexedDB wiring
- docs/log/2026-03-11 0100 Pagination.md — fixed page layout, row height, multi-room packing
- docs/log/2026-03-11 0200 RowHeight.md — attempted flex fix, root cause isolated
- docs/log/2026-03-11 0300 LayoutAndPhotos.md — 2x2 grid layout, single-room pairing, photo compression
- docs/log/2026-03-11 1900 Refactor.md — module extraction, photo pan/zoom fix, useReducer
- docs/log/2026-03-11 2000 PhotoPolish.md — background-image approach, window-level drag, both-axis pan
