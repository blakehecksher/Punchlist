# State
_Last updated: 2026-08-19_

## Current focus
Hardening finished. The next piece of work is the outline editing pane, on its
own branch and in its own conversation.

## What's working
- One continuously editable punch list. Preview / Print PDF is the only
  document-version action.
- **Printing writes a backup.** `Project_punchlist YYMMDD.json`, to the chosen
  backup folder if one is set and still writable, otherwise to the browser's
  download folder. The toolbar reports the file name and where it went. A
  failed backup is reported but never blocks the print. The example project
  prints without downloading; an explicit Save backup file still writes one.
- **Backup folder is choosable** under More actions. The default is the
  download folder, which needs no permission. A chosen folder persists across
  sessions, and Use Downloads reverts. A repeat backup on the same day is
  suffixed `(1)` rather than overwriting.
- **The folder control reports the real destination.** Browsers drop write
  permission between sessions; a folder in that state shows the true
  destination plus a one-click Reconnect, instead of displaying its name while
  backups quietly go elsewhere. Declining the browser's permission prompt is
  reported rather than passing silently, and the default state carries a hint
  about picking a normal folder, since browsers block folders holding system
  files.
- **`npm run typecheck`** runs TypeScript in JSDoc mode over the data layer.
  Files opt in with `// @ts-check`; shared shapes live in `src/types.d.ts`.
  Components are deliberately not checked.
- **Undo covers the destructive actions** — remove item, remove room, Clear
  all, Import merge — restoring the item and its photo, and it is dropped on a
  project change so it can never be applied to a different document.
- **Orphaned photos are collected only after a backup** that provably contains
  them. A document with no items reports no orphans, so a failed load cannot
  trigger a mass delete.
- **Deleting a project stays two clicks and now says whether a backup exists**:
  the confirm step shows "Never backed up · click again to delete" or the
  backup age in its place.
- **Save failures are visible** in a banner with a one-click backup action.
  `navigator.storage.persist()` is requested on load.
- Saved records and backup files carry `schemaVersion`.
- Item state reads from inline formatting only. Any bold, underline, or
  strikethrough anywhere in an item flags the whole item.
- `npm test` (72 tests), `npm run lint`, `npm run typecheck`, and
  `npm run build` pass. CI gates all four.

## Module map
- `PunchListApp.jsx` — the component: reducer, handlers, page rendering.
- `projectData.js` — document shape, `normalizeStoredData`, `stripPhotos`.
- `exampleProject.js` — the practice project fixture and its refresh rule.
- `mergeNotes.js` / `items.js` — import merge and shared item helpers.
- `projectStore.js` — localStorage index, schema version, backup bookkeeping.
- `projectFile.js` / `backupLocation.js` — backup payload, naming, destination.
- `types.d.ts` / `browser.d.ts` — the document model, and the browser APIs
  TypeScript's DOM library lacks.
- `photoGc.js` / `idb.js` — orphan detection and the photo store.
- `pagination.js` / `layout.js` / `endOfPunchList.js` — document layout.
- `importParser.js` / `importHtml.js` / `importFile.js` — external input.

## In progress
- Nothing. This round is complete and verified in a real Chromium session.

## Known issues
- Project data is still browser-local. Backups narrow the window; they do not
  remove the risk.
- Deleting a project clears its photos immediately. It is now an informed
  choice rather than a blind one, but it is still not undoable.
- A granted backup folder cannot be tested headlessly — a real
  `FileSystemDirectoryHandle` cannot be constructed from a test. The write
  logic, the lapsed-permission state, and the download fallback are all
  covered; only the granted handoff needs a manual check.
- Type checking covers the data layer only. `PunchListApp.jsx`, the other
  components, `idb.js`, and the importers are unchecked by choice.
- Firefox and Safari have no directory picker, so the control hides itself
  there and backups go to the download folder. That matches the project's
  single-browser scope.
- `paginateDetail` does not charge empty sections against the page row budget.
- `paginateSummary` estimates wrapped lines by character count and clamps at
  three, so a very long description can under-budget its rows.
- The rich outline editor relies on the browser's content-editing commands.
- Legacy snapshot data from the removed issuance system remains dormant in
  browser storage until its project is deleted.

## Next actions
1. Merge this branch and confirm the hosted app updates from `master`.
2. Add the Playwright smoke suite in `testing.md` — the flows are listed and
   have all been run by hand; checking them in is what makes them repeatable.
   This is the largest remaining gap.
3. Build the outline pane: outline right, paginated document left, each line
   bound to a real item ID (see `decisions.md` and `spec.md`). Its new modules
   are the natural place to try `.ts` directly rather than JSDoc.

## How to verify
```text
npm test
npm run lint
npm run typecheck
npm run build
Print and confirm a Project_punchlist YYMMDD.json file is written and the
  toolbar names it and its destination.
Sidebar → More actions → Backup folder → Choose. Print again and confirm the
  file lands in that folder; then Use Downloads and confirm it reverts.
Choose a folder and decline the browser's permission prompt; confirm the app
  says permission was refused rather than appearing to accept the folder.
With a folder chosen, revoke its permission in the browser and reload; confirm
  the sidebar shows Reconnect and reports Downloads as the destination.
Print twice in one day into a chosen folder and confirm the first file is
  still there alongside a "(1)" copy.
Remove an item with a photo, click Undo, confirm both come back.
Remove an item with a photo, dismiss the undo, print, confirm the photo is
  gone from IndexedDB but present in the saved backup.
Click delete on a project once and confirm the row reports its backup age.
Underline an item, reload, confirm its code is still underlined.
```

## Recent logs
- docs/log/2026-08-19 2200 Backup folder honesty and opt-in typecheck.md —
  fixed the folder control reporting a destination it was not writing to, and
  added JSDoc type checking over the data layer.
- docs/log/2026-08-19 0900 Backup folder, load-path tests, delete safety.md —
  choosable backup folder, extracted and tested read path, backup age at the
  delete confirmation.
- docs/log/2026-08-19 0500 Durability, undo and gated photo cleanup.md — backup
  on print, undo, gated orphan sweep, visible save failures, schema version,
  formatting as the only item state, CI gating.
- docs/log/2026-08-14 1325 Publish simplified workflow branch.md — prepared the
  reviewed simplification for GitHub merge.
