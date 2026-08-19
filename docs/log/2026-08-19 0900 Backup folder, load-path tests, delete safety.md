# 2026-08-19 0900 Backup folder, load-path tests, delete safety

## TL;DR
- What changed: backups can go to a folder the user picks instead of the
  download folder; `normalizeStoredData` and the example fixture moved into
  tested modules; the project delete confirmation now reports whether a backup
  exists.
- Why: the previous round made data recoverable but left the read path — the
  code most able to break a real user's saved project — untested, and left the
  user with no way to answer "can I get this back?" before deleting.
- What didn't work: the first browser test of the folder feature used a fake
  directory handle with methods on it, which is not structured-cloneable, so it
  never persisted. The code was right and fell back correctly; the test double
  was wrong. That prompted a better factoring.
- Next: the outline pane, on its own branch.

---

## Full notes

### Extracting the read path found a real crash

`normalizeStoredData`, `makeBlankProjectData`, `stripPhotos` and the example
fixture moved to `src/projectData.js` and `src/exampleProject.js`. The
component drops from 2,594 to about 2,150 lines, but the point was coverage,
not size: this is the code that decides whether a record written by an older
release still opens.

The first test written against it failed immediately. `normalizeStoredData(null)`
threw, because `normalizeDocumentEndEntries(stored = {})` used a default
parameter — which covers `undefined` but not `null`, and `null` is exactly what
`loadProjectData` returns for a missing or corrupt record. Every current call
site happens to guard, so it was latent rather than live, but it was one new
call site away from being a crash on load. Fixed at the helper, where it
benefits every caller.

Thirteen tests now cover the read path: minimal records, missing records,
unknown fields preserved, photos reattached by item ID in both the current
`{ dataUrl, position }` form and the older bare-string form, legacy state flags
and issuance data dropped, historical issuance dates migrated into the document
ending, placeholder headers cleared, and issue sequences backfilled when
missing or duplicated. Seven more cover the example fixture, including that it
demonstrates each formatting convention in its own markup — the thing that
silently stopped working under the old `isNew` boolean.

### Backup folder

The download folder stays the default: no permission, no prompt, no setup. A
user who wants backups somewhere specific picks a folder once under More
actions. The handle lives in an IndexedDB settings store, because directory
handles are structured-cloneable but not JSON-serialisable, so localStorage
cannot hold one.

Every path falls back to a download rather than failing — folder deleted, drive
unplugged, permission lapsed, quota, or no directory picker in this browser at
all. The reasoning is the same one behind the gated photo sweep: a backup
written somewhere unexpected is recoverable, one never written is not.

A repeat backup on the same day is suffixed `(1)`, `(2)` rather than
overwriting, matching what the browser does with a repeat download and avoiding
the case where a bad write replaces a good backup.

### The test double that taught us something

The first attempt drove the whole feature through the UI with
`window.showDirectoryPicker` stubbed to return a fake handle. It reported the
folder was never set. The cause was the double, not the code: a plain object
carrying methods cannot be structured-cloned into IndexedDB, so the write
silently failed and the app fell back to a download — correct behaviour, badly
tested.

The fix was to split `writeIntoDirectory(directory, filename, contents)` out of
`writeToBackupFolder`. Taking the handle as an argument means the whole write
path — collision handling, create, write, close, and every failure resolving to
null — is testable in plain Node with no browser at all. What genuinely needs a
browser is now just the handle round trip, and that is called out in
`testing.md` as a manual check rather than pretended away.

### Project deletion

Two clicks is the right amount of friction; the missing piece was information.
The confirm step swaps the project's date line for its backup age:
"Never backed up · click again to delete", or "Backed up 3h ago · click again
to delete". No extra step, and the one fact that matters is where the user is
already looking.

`lastBackupAt` lives on the project index rather than in the document, so it
survives Clear punch list and never rides along inside a backup file. The
example project keeps its "Practice project" label instead — it is disposable
by design.

### A second bug caught in the browser

Backup age initially always read "Never backed up" despite being recorded
correctly. The sidebar renders a cached copy of the project index, and nothing
refreshed it after a backup. Only visible by clicking through the real UI —
the unit tests for `recordBackup` and `describeBackupAge` both passed.

### Test count

37 → 69.
