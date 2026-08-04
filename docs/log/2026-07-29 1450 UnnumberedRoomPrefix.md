# 2026-07-29 1450 UnnumberedRoomPrefix

## TL;DR
- What changed: Rooms with no number in their name now code as `000-NN`
  instead of `RM-NN`, sort to the top of the document, and carry a
  screen-only "Add room no." flag in the room header.
- Why: Blake's call on the open question from the earlier review pass. An
  unnumbered room is a mistake, not a category — so it should look like a
  blank waiting to be filled in, sit where it will be seen, and be one edit
  to correct.
- What didn't work: Nothing. One migration wrinkle was handled: notes copied
  out before this change carry `RM-NN`, so merge import matches both forms.
- Next: Confirm in a real project that `000` rooms read the way Blake wants
  on a printed set.

---

## Full notes

### Changes

**`issueIds.js`** — `getRoomIssuePrefix` falls back to `UNNUMBERED_ROOM_PREFIX`
(`"000"`). Added `isUnnumberedRoom` and `formatLegacyIssueCode`, the latter
returning the old `RM-NN` form for unnumbered rooms only.

**`PunchListApp.jsx`**
- `getRoomSortNumber` parses the prefix as before, so `000` yields 0 and
  unnumbered rooms sort ahead of every numbered one. Unnumbered rooms tie at
  0 and fall through to the existing alphabetical tiebreak.
- The `Number.POSITIVE_INFINITY` fallback is gone. It was what produced the
  `Infinity - Infinity` NaN fixed earlier today; the fallback is now 0, and a
  comment records why it has to stay finite.
- `buildIssueCodeIndex` registers the legacy `RM-NN` code alongside the
  current one, so a merge re-import of older copied notes updates the
  existing item instead of appending a duplicate.
- The room header renders an "Add room no." chip when the room has no
  number, on the room's first chunk only (same rule as the Remove button, so
  continuation headers stay clean).

**`styles.css`** — chip styling with 3x3/4x4 density overrides, and
`.room-number-warning` added to the print `display: none` list. The flag is a
working aid; the printed set just shows the `000-NN` codes.

### Verification
8 new browser assertions, all passing, plus the 15 from the earlier pass
re-run with no regressions:

- `000` prefix applied to unnumbered rooms only; `GN` and numbered rooms
  unchanged
- legacy `RM` code offered for unnumbered rooms only, never for General Notes
- unnumbered rooms sort to the top, alphabetically among themselves
- one flag chip per unnumbered room, none on continuation headers
- chip hidden under `@media print`, pages still fit the sheet
- typing a room number clears the flag and re-codes the items live
- a merge import carrying old `RM-01` codes reports "1 updated, 0 new items"

`npx eslint src` and `npm run build` pass.

### Note
No stored data depends on the prefix — only `issueSeq` is persisted — so this
is a display and sort change. Existing projects pick it up with no migration.
