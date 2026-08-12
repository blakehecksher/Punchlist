# State
_Last updated: 2026-08-12_

## Current focus
Maintain a release-ready import-to-PDF workflow where previewing is consequence-free and every issued snapshot can be revisited, edited directly, or used as the basis for a correction.

## What's working
- The local Vite/React app passes `npm test`, `npm.cmd run lint`, and `npm.cmd run build`.
- Preview / Print PDF opens the browser print flow without locking the project or adding an issuance record.
- Record as issued creates an immutable dated snapshot, stores its document and photos, locks the working copy, and adds the version to the document ending.
- Issued versions appear indented beneath the active project in the sidebar. Selecting any version opens that snapshot with Reprint, Fix issued version, and return-to-current actions.
- Fix issued version works on the selected snapshot, including older versions. Users can edit that issuance in place or preserve it and create a correction from it.
- Direct issuance edits keep the selected record's ID, issue date, numbering, and position in history while updating its document, photos, title, and counts.
- Creating a correction from an older version starts with that version's document and points the new correction record back to the selected snapshot.
- The bottom Issuances workspace is compact by default; issued-version management remains available in a disclosure.
- The final printed page contains a top-left `End of Punch List` record with a full-width rule and indented issuance lines. Ten records fill the first column before a second column begins.
- Document Settings includes `Show issuances`; turning it off keeps `End of Punch List` but hides its dated history.
- The importer accepts numeric markers such as `1.` and `1)` in both named sections and nested room outlines, in addition to bullet markers.
- The first detail page reserves enough room for site conditions; more than six conditions receive a dedicated first page.
- Detail pages use one fixed four-card layout, and older saved six-card layouts migrate automatically.
- General items use `GEN-NN`; an unnumbered Exterior section uses `EXT-NN`. Old `GN`, `000`, and `RM` exports still match during re-import.
- A clean first import is treated as the baseline and shows zero new items. Opening a correction or the next issuance clears prior new markers.
- Import Notes supports Bold, Underline, and Strikethrough across several item lines while preserving parseable list structure.
- The Prepared by header field starts wider and expands with longer firm names without colliding with the centered document title.
- The production build is published from `master` through the native GitHub Actions Pages workflow.

## In progress
- Remaining release-readiness improvements: browser smoke/print regression tests, Print/PDF metadata preflight, destructive-action recovery, local-save/backup messaging, and a stronger existing-project import-success handoff.

## Known issues
- The legacy `gh-pages` branch remains for deployment history but is no longer used by GitHub Actions Pages.
- GitHub's top-level Pages API status still reports `errored` from the old legacy build, although the current deployment endpoint reports `succeed` and the public URL serves the current build.
- Item codes in the working draft are derived from the current room name; issued snapshots are stable, but a live code can change before the next issuance.
- Bold and strikethrough still influence revised/completed counts; explicit item lifecycle state is not implemented.
- Re-import can remove missing working items, and direct item/room removal has no visible recovery path. Issued snapshots remain intact.
- Project data is browser-local and can disappear if browser data is cleared or the user changes devices without exporting a backup.
- A formal issuance can still be recorded with blank project metadata; there is no short preflight yet.
- `paginateDetail` does not charge empty sections against the page row budget.
- The rich outline editor relies on the browser's content-editing command support for formatting.

## Next actions
1. Add browser smoke/print regression coverage for preview printing, editing old snapshots, correction-from-selected behavior, persistence, photos, and long site-condition pages.
2. Add a short formal-issuance preflight for blank project metadata and optional issuance notes.
3. Add undo/recovery for removed rooms and items, plus review before re-import removes missing items.

## How to verify
```text
npm test
npm.cmd run lint
npm.cmd run build
Click Preview / Print PDF; cancel print and confirm the project stays editable and no issued version is added.
Click Record as issued; confirm the project locks, the document ending gains an entry, and the sidebar gains an indented snapshot.
Select any issued version in the sidebar; confirm it can be reprinted and Back to current document restores the working copy.
Choose Fix issued version > Edit this issued version; confirm the selected snapshot becomes editable and Save issued version updates that snapshot in place.
Choose Fix issued version > Create correction from this version; confirm a Correction draft opens using the selected snapshot's document.
Open Manage issued versions and confirm titles and Reprint controls remain available.
Enter a long Prepared by name; confirm the field expands without overlapping the centered title.
git -c safe.directory='G:/Files/Github/Punchlist' status --short --branch
```

## Recent logs
- docs/log/2026-08-12 0903 Edit any issued version.md - made Fix issued version operate on the selected snapshot with direct-edit and correction choices.
- docs/log/2026-08-12 0122 Separate preview and issuance.md - separated consequence-free PDF preview from formal issuance and added sidebar snapshot navigation plus the replacement/correction decision.
- docs/log/2026-08-12 0041 Expand prepared-by field.md - widened the Prepared by input and made its width respond safely to longer firm names.
- docs/log/2026-08-11 1600 Testing pagination and numbered import.md - added the initial automated test layer, protected the first detail page from oversized site-condition lists, and documented numbered-list imports.
- docs/log/2026-08-06 1133 GitHub Pages rerun succeeded.md - reran the complete master workflow after the manual Pages reset and verified the live site updated.
- docs/log/2026-08-06 0836 Optional issuance history and ending flow.md - added the Show issuances setting and made the document ending occupy the next available row.
- docs/log/2026-08-06 0052 Parser semantics and document ending.md - added GEN/EXT aliases, baseline new-item logic, safe multi-line formatting, formatted-heading parsing, and the left-aligned multi-column issuance ending.
- docs/log/2026-08-06 0017 Issuance document ending and importer fixes.md - fixed four-card pagination, document-end issuance history, editable labels, importer formatting edge cases, and panel alignment.
- docs/log/2026-08-05 2332 Immutable issues and rich notes.md - implemented lock/correct/reissue history, true WYSIWYG outline formatting, and snapshot-aware backups.
