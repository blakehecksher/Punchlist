# State
_Last updated: 2026-03-12_

## Current focus
Finish validating the dense layout presentation details in live usage, especially 4x4 with photos on.

## What's working
- `npm run dev` serves the app locally
- Pushes to `master` build and deploy via `.github/workflows/deploy.yml`
- The punch list editor, import flow, photo handling, and local persistence are working
- Layout settings are saved per project with density `2x2` / `3x3` / `4x4` and photos on/off
- Pagination packs General Notes and room items into density-based row groups with per-span continuation headers
- Continued General headers now match the intended typography, joined room headers show a visual separator, and last-page rows keep the selected density height instead of stretching
- `npm run build` passes and `npx eslint src` passes

## In progress
- Manual browser and print/PDF review of dense photo-on layouts with real project content
- Checking whether 4x4 with photos needs any further spacing or typography tuning after live use

## Known issues
- `npm.cmd run lint` still fails on legacy `PunchList_925Park.jsx` issues outside the current `src/` app path
- Dense photo-on layouts still need broader real-project validation in the browser
- Word import validation against real `.docx` exports is still pending

## Next actions
1. Run through 2x2, 3x3, and 4x4 with real projects and confirm the visual polish holds beyond the sample data.
2. Print to PDF from each density and verify the fixed row-height behavior on short final pages.
3. Decide whether 4x4 photo-on needs another small polish pass after additional live use.

## How to verify
```bash
cd "c:/Users/blake/OneDrive - John B. Murray Architect/0001 Office/Program Playground/Punchlist"
npm run dev
# open http://localhost:5173
# confirm continued General headers keep the same type styling as the initial header
# confirm adjacent room headers show a separator line where spans meet
# confirm short final pages leave blank space below instead of stretching the remaining item rows
# switch density and photo visibility in the left sidebar and confirm layout persistence across reload/project switches
# print to PDF and compare against the on-screen page layout
npm run build
npx eslint src
```

## Recent logs
- docs/log/2026-03-12 2158 DensityPolish.md — fixed continued General header typography, header separators, and last-page row stretching
- docs/log/2026-03-12 2127 DensityControls.md — added per-project density and photo visibility settings with density-aware pagination
- docs/log/2026-03-12 0129 RemoveClipboardButton.md — removed the direct clipboard-read button and returned the import drawer to the file-import-first workflow
