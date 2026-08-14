# State
_Last updated: 2026-08-14_

## Current focus
Merge the reviewed simplified Punch List branch into `master`.

## What's working
- The app keeps one continuously editable punch list; it has no issuance, lock, correction, or saved-snapshot workflow.
- Preview / Print PDF is the only document-version action. The PDF a user saves is the version record.
- The final document row says `End of Punch List` and contains an editable list of optional issue-date lines.
- `+ Add issue date` prefills `Punch List issued [document date]`; every line remains free text and has an X remove control.
- `+ Add room` appears immediately after the final area's Add Item action and before the End of Punch List box.
- Existing projects discard issuance workflow state on load and migrate valid historical issuance dates into editable ending lines.
- Project backups include the working project and photos but no issued snapshots. Older backups still load their working project and photos.
- The sidebar no longer lists issued versions or offers a Show issuances setting.
- Punch-item codes remain as stable item identifiers; they are separate from the removed issuance workflow.
- `npm.cmd test`, `npm.cmd run lint`, and `npm.cmd run build` pass with 15 tests.
- Browser verification confirms add, edit, save/reload, and remove behavior; it also confirms the requested final-page control order.

## In progress
- The simplification is prepared on `codex/simple-punch-list` from the latest `origin/master` for GitHub review and merge.

## Known issues
- Project data is browser-local and can disappear if browser data is cleared or the user changes devices without exporting a backup or saving PDFs.
- Re-import can remove missing working items, and direct item/room removal has no visible recovery path.
- `paginateDetail` does not charge empty sections against the page row budget.
- The rich outline editor relies on the browser's content-editing command support for formatting.
- Legacy snapshot data is no longer accessible in the UI; it remains dormant in browser storage until its project is deleted.

## Next actions
1. Merge `codex/simple-punch-list` into `master` on GitHub.
2. Confirm the hosted app updates from `master`.
3. Test a representative real punch list and save a PDF with one and several issue-date lines.

## How to verify
```text
npm.cmd test
npm.cmd run lint
npm.cmd run build
Click Add issue date and confirm it prefills from the document date.
Edit the ending line, wait for Saved, reload, and confirm the value remains; then remove it with X.
Click Preview / Print PDF and confirm the entered lines appear while empty controls do not.
Confirm the toolbar, sidebar, and page contain no issuance, correction, lock, or snapshot controls.
Open an older project with issuance history and confirm its prior valid dates appear in the new field.
git -c safe.directory='G:/Files/Github/Punchlist' status --short --branch
```

## Recent logs
- docs/log/2026-08-14 1325 Publish simplified workflow branch.md — prepared the reviewed simplification for GitHub merge.
- docs/log/2026-08-14 0926 Editable ending entries.md — added optional editable issue-date lines and moved Add Room above the document ending.
- docs/log/2026-08-14 0117 Simplify to one editable document.md — removed issuance versioning and replaced the document ending with one autosaved date field.
- docs/log/2026-08-12 0903 Edit any issued version.md — prior issuance workflow, now superseded by the one-document model.
- docs/log/2026-08-12 0122 Separate preview and issuance.md — prior preview/snapshot model, now superseded by PDF-only version records.
