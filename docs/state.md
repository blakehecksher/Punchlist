# State
_Last updated: 2026-08-19_

## Current focus
Durability and recoverability work, ahead of building the outline editing pane.
The app is shared with testers, so every change in this round is additive to
stored data.

## What's working
- The app keeps one continuously editable punch list. Preview / Print PDF is
  the only document-version action.
- **Printing writes a backup.** Preview / Print PDF saves
  `Project_punchlist YYMMDD.json` to the browser's download folder and reports
  the file name. A failed backup is reported but never blocks the print. The
  example project prints without downloading anything; an explicit Save to file
  still writes one. Backup files carry `schemaVersion` alongside `_version`.
- **Undo covers the destructive actions.** Removing an item, removing a room,
  Clear all, and Import merge each raise a 15-second undo toast. Undo restores
  the item and its photo, because removal no longer deletes from IndexedDB. A
  pending undo is dropped when the project changes, so it can never be applied
  to a different document.
- **Orphaned photos are collected only after a backup**, and only for photos
  provably inside that backup's payload, so the delete is recoverable by
  loading the file. A document with no items reports no orphans, so a failed
  load cannot trigger a mass delete.
- **Save failures are visible.** A quota error holds a dismissable banner under
  the toolbar with a one-click backup action instead of being swallowed.
- `navigator.storage.persist()` is requested on load, so the origin is less
  likely to be evicted silently under disk pressure.
- Saved records carry `schemaVersion`; `getRecordSchemaVersion` reports 0 for
  anything written before the stamp.
- Item state (new / revised / complete) reads from inline formatting only. The
  stored `isNew` boolean is gone — it was reset on every load and so always
  disagreed with the document. Copy Notes now agrees with the printed page.
- `src/mergeNotes.js` and `src/items.js` hold the import merge and shared item
  helpers, with direct test coverage.
- CI runs test, lint and build on pull requests, and Pages deploys only after a
  verify job passes.
- `npm test` (36 tests), `npm run lint`, and `npm run build` pass.

## In progress
- Nothing. This round is complete and verified in a real Chromium session.

## Known issues
- Project data is still browser-local. The print-time backup narrows the window
  but does not remove the risk; users should keep the JSON files.
- Choosing a backup folder other than the browser download default is not built
  yet. The seam for it is `backupAndSweep` in `src/PunchListApp.jsx`.
- Deleting a whole project from the sidebar still clears its photos immediately
  and has no undo. It is the one remaining unrecoverable action.
- `normalizeStoredData` and the example-fixture refresh remain untested; they
  are inside `PunchListApp.jsx` and need a browser suite rather than a unit
  test. This is the documented next test layer.
- `paginateDetail` does not charge empty sections against the page row budget.
- `paginateSummary` estimates wrapped lines by character count and clamps at
  three, so a very long description can under-budget its rows.
- The rich outline editor relies on the browser's content-editing commands.
- Legacy snapshot data from the removed issuance system remains dormant in
  browser storage until its project is deleted.

## Next actions
1. Merge this branch and confirm the hosted app updates from `master`.
2. Build the outline pane on a separate branch: outline right, paginated
   document left, each line bound to a real item ID (see `decisions.md`).
3. Add the Playwright smoke suite described in `testing.md`, including a print
   screenshot test, before the outline work changes the editing model.

## How to verify
```text
npm test
npm run lint
npm run build
Click Preview / Print PDF and confirm a Project_punchlist YYMMDD.json file is
  written and its name is reported in the toolbar.
Remove an item that has a photo, click Undo, and confirm the item and its photo
  both come back.
Remove an item with a photo, dismiss the undo toast, print, and confirm the
  photo is gone from IndexedDB but present in the saved backup file.
Attach a photo, reload, and confirm it is still attached.
Underline an item's text, reload, and confirm its issue code is still
  underlined and the item still counts as new.
Copy Notes and confirm underlined and struck items carry __code__ and ~~code~~.
```

## Recent logs
- docs/log/2026-08-19 0500 Durability, undo and gated photo cleanup.md — backup
  on print, undo, gated orphan sweep, visible save failures, schema version,
  formatting as the only item state, CI gating.
- docs/log/2026-08-14 1325 Publish simplified workflow branch.md — prepared the
  reviewed simplification for GitHub merge.
- docs/log/2026-08-14 0926 Editable ending entries.md — optional editable
  issue-date lines and Add Room above the document ending.
- docs/log/2026-08-14 0117 Simplify to one editable document.md — removed
  issuance versioning.
