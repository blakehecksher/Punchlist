# 2026-08-19 0500 Durability, undo and gated photo cleanup

## TL;DR
- What changed: print now writes a backup file; destructive actions are
  undoable; orphaned photos are collected only after a backup that contains
  them; save failures are visible; stored records carry a schema version; the
  dead `isNew` boolean is gone so formatting is the only item state; the import
  merge moved into a tested module; CI gates the Pages deploy.
- Why: the app is shared with testers and every failure mode was silent —
  a full quota stopped saving without telling anyone, and removing a room
  destroyed its photos with no recovery.
- What didn't work: three things caught on review. The storage-failure banner
  was first placed in normal document flow, where the fixed toolbar covered it
  (pinned under the toolbar now, with an `.app--alert` modifier moving the page
  stack down). A pending undo survived a project switch and would have written
  one project's document into another. And the backup file did not carry
  `schemaVersion` — the artifact most likely to be opened by much later code
  was the one without a shape stamp.
- Next: build the outline pane on its own branch — outline right, paginated
  document left, each line bound to a real item ID.

---

## Full notes

### Everything in this round is additive to stored data

Testers already have projects in their browsers. Nothing here rewrites or
reshapes a saved record, so an existing project opens unchanged. The one
behavioural change to stored data is that a legacy `isNew` field is now
dropped on load instead of being reset to `false` — it never survived a reload
anyway, so nothing observable is lost.

### Removal no longer deletes photos

`discardPhotos` deleted from IndexedDB the instant an item or room was removed,
and `Clear all` wiped the project's photos outright. That is what made those
actions unrecoverable. All three eager deletes are gone. A photo now outlives
its item, which is what lets undo restore both.

### The sweep is gated on a backup that provably contains the photo

Orphans are collected in `backupAndSweep`. The order matters:

1. `saveProjectToFile` reads every photo under the project's key prefix —
   orphans included — serializes them into the file, and resolves with that
   payload.
2. Only orphans present in that payload are deleted.

So a swept photo's bytes are always inside the file the user just saved, and
loading that backup restores it. `findOrphanPhotoIds` also refuses to report
anything when the document has no items, because an empty document and a
failed load look identical, and that case would otherwise delete everything.

Verified end to end in Chromium: attach a photo, remove its item (photo
survives), undo (item and photo both return), remove again and dismiss the
toast, print (backup written, photo gone from IndexedDB, photo present in the
file).

### Save failures are no longer silent

The autosave caught quota errors and did nothing, so a user could keep typing
into a document that had stopped being written to disk. Failures now hold a
banner under the toolbar with a Save backup file action. Verified by stubbing
`localStorage.setItem` to throw `QuotaExceededError`.

`navigator.storage.persist()` is requested once per load. It is a request, not
a guarantee — Chrome grants it based on engagement — but without it the origin
is evictable under disk pressure.

### Formatting is the only source of item state

`normalizeStoredData` set `isNew: false` on every item on every load, so the
boolean could never survive a refresh while the `<u>` markup in the description
always did. Two mechanisms, only one working. The boolean is removed.

This surfaced a real inconsistency: Copy Notes read the dead boolean, so
exported outlines never marked new items, while the summary read the
formatting and did. Both read formatting now.

The example fixture used the boolean to opt entries out of "new", so it
demonstrated nothing after a reload. It uses real markup now — one underlined,
one bold, one struck — and `EXAMPLE_VERSION` is bumped to 3 so existing example
projects refresh.

### Schema version

`SCHEMA_VERSION` is stamped on every save. `getRecordSchemaVersion` returns 0
for records written before the stamp. No conversion machinery is added — that
arrives with the first shape change that needs it. The point is only that a
future change can tell what it is reading.

### The merge is testable now

`mergeImportedNotes` was buried in `PunchListApp.jsx` with no coverage, despite
being the code most likely to lose work: it drops working items the incoming
outline omits, and a bad match detaches a photo. It now lives in
`src/mergeNotes.js`, with `src/items.js` holding `uid`, `makeItem`, and
`normalizeRoomKey`. Six tests cover identity preservation on re-import,
insertion without renumbering, drop reporting, untouched rooms, site-condition
preservation, and the absence of a stored state flag.

### CI

`deploy.yml` built and published without running the tests. Deploy now depends
on a verify job running `npm test` and `npm run lint`, and a new `ci.yml` runs
test, lint and build on pull requests.

### Test count

15 → 36.

### Deliberately not done

- Choosing a backup folder other than the download default. The default covers
  the common case with no permission prompt; `backupAndSweep` is the seam.
- Project deletion still clears photos immediately with no undo. It is the last
  unrecoverable action and wants its own design.
- `paginateSummary`'s character-count line estimate is untouched.


### Caught on review, after the first pass worked

Three defects survived the first implementation and were found by re-reading
the diff adversarially rather than by a failing test:

1. **Undo leaked across projects.** `undoState` holds a whole document. Nothing
   cleared it on a project switch, so removing an item, switching projects, and
   clicking Undo would have loaded the first project's document into the
   second and autosaved it there. Now cleared by an effect on `activeId`,
   which covers switch, new, duplicate, delete, and load-from-file at once.

2. **The example project downloaded a backup on print.** Its banner promises
   "explore freely"; a mystery JSON file contradicts that. Automatic backups
   skip the example, explicit Save to file does not.

3. **Backup files had no `schemaVersion`.** The stamp was applied inside
   `saveProjectData`, so it reached localStorage but not the exported file —
   exactly backwards, since a file on disk outlives a browser record and is far
   more likely to be opened by much later code. `buildBackupPayload` now stamps
   it, and `_version` versus `schemaVersion` are documented as envelope versus
   document.

### Verified in Chromium

Every claim above was checked in a real browser session, not only by unit test:
example print writes no file but still prints; a real project's print writes
`530 Harris Road_punchlist 260819.json` carrying `schemaVersion: 1`; a photo
survives its item's removal, returns on undo, and is collected only after the
backup that contains it; a forced `QuotaExceededError` raises the banner; a
pending undo is dropped on project switch; an underlined item's code is still
underlined after a reload.
