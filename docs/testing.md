# Testing

The app is a static Vite/React application, so the first useful test layer is
fast unit coverage around the pure import, pagination, and storage functions.
That layer runs without a browser and should run on every change and before a
GitHub Pages deployment.

## Current automated coverage

- `src/importParser.js`: bulleted and numbered section formats, nested numbered
  outlines, and issue-code re-import matching.
- `src/pagination.js`: the first-page site-condition rule, page-two overflow,
  and the normal two-row capacity when site conditions are not rendered.
- `src/projectStore.js`: project round trips, preservation of unknown saved
  fields, legacy migration safety, active-project selection, and the stored
  schema version.
- `src/mergeNotes.js`: item identity across a re-import, insertion without
  renumbering, reporting of dropped items, untouched rooms, site-condition
  preservation, and the absence of a stored state flag. This is the most
  destructive path in the app, so it gets the most direct coverage.
- `src/photoGc.js`: orphan detection, the empty-document guard that stops a
  failed load from deleting every photo, and the rule that only photos inside
  a written backup may be collected.
- `src/projectFile.js`: backup file naming, including the untitled fallback and
  character stripping.
- `src/exportNotes.js`: new and complete markers in the copied outline are read
  from the item's formatting, and a stale stored flag is ignored.
- `src/projectData.js`: the read path every project open goes through — minimal
  and missing records, unknown fields preserved, photos reattached by item ID
  in both the current and the older bare-string form, legacy state flags and
  issuance data dropped, placeholder headers cleared, and issue sequences
  backfilled when missing or duplicated.
- `src/exampleProject.js`: the fixture carries each formatting convention in
  its own markup, its item IDs are unique, and a stale fixture version is
  replaced while a current one and a real project are left alone.
- `src/backupLocation.js`: collision-free file naming and the directory write,
  including that every failure resolves to null so the caller falls back to the
  download folder rather than losing the backup.
- `src/endOfPunchList.js`: a null record is treated like an empty one.

Run it with:

```text
npm test
```

## Next layer

The next addition should be a browser smoke suite using a real Chromium
session, checked into the repo and run in CI. The flows below were all verified
by hand in Chromium during the 2026-08-19 durability work and are the ones
worth automating first, because none of them can be covered by a unit test:

- Create a project, import an outline, attach a photo, reload, and confirm the
  photo is still attached.
- Remove an item that has a photo, click Undo, and confirm the item and its
  photo both return.
- Remove an item with a photo, dismiss the undo toast, print, and confirm the
  photo is gone from IndexedDB but present in the downloaded backup file.
- Force a `QuotaExceededError` from `localStorage.setItem` and confirm the
  storage banner appears rather than the save failing silently.
- Underline an item, reload, and confirm the issue code is still underlined —
  this is the regression that the removed `isNew` boolean used to cause.
- Load a project record written without a `schemaVersion` and confirm it opens.
- Choose a backup folder, print, and confirm the file lands there rather than
  in the download folder; then revoke the folder's permission and confirm the
  next print falls back to a download instead of failing.

A real `FileSystemDirectoryHandle` cannot be constructed from a test, so the
handle round trip through IndexedDB is the one part of the backup-folder
feature that needs checking by hand in a browser. The write logic itself takes
a handle as an argument specifically so it can be tested without one.

`normalizeStoredData` and the example-fixture refresh have no unit coverage;
they live inside `PunchListApp.jsx` and this suite is where they get tested.

A print screenshot test should cover a short and a long site-condition list so
page one cannot regress into undersized cards.

Before deployment, run:

```text
npm test
npm run lint
npm run build
```
