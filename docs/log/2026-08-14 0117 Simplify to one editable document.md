# 2026-08-14 0117 Simplify to one editable document

## TL;DR
- What changed: Removed issuance recording, locks, corrections, snapshot navigation/storage, and issuance settings; replaced the final history area with one autosaved date text field.
- Why: The product should maintain one editable punch list, with user-saved PDFs serving as version records.
- What didn't work: The first background preview launch path failed because of a Windows environment conflict; the preview was started directly with the bundled Node runtime instead.
- Next: Test a representative project and publish after user review.

---

## Full notes

- Started `codex/simple-punch-list` from the freshly fetched `origin/master`; GitHub's default branch is `master` and the deleted `main` remote ref was pruned.
- Preserved the prior living-notes branch's uncommitted session journal in a named Git stash before switching.
- Removed the issuance footer, Record as issued, Start next issue, correction choices, snapshot banners, sidebar history, read-only locks, issuance backup payloads, and their dedicated tests/styles.
- Kept punch-item issue codes because they are stable item numbers, not document issuances.
- Added `endOfPunchListDates` to the autosaved project data and a plain text input in the existing final document row.
- Added a compatibility conversion that collects unique valid dates from legacy issuance history and puts them into the new field.
- Kept the old IndexedDB snapshot store dormant only so deleting a project also deletes its abandoned legacy data.
- Added tests for legacy date conversion and document-end pagination.
- Verified 13 tests, lint, production build, date persistence through reload, the simplified toolbar, and a clean browser console.
