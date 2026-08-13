# State
_Last updated: 2026-08-13_

## Current focus
Test the living Punch List Notes workflow across computers from its GitHub branch and Pages deployment.

## What's working
- Punch List Notes is a persistent, autosaved outline rather than a one-time import form.
- Room headings, indentation, item order, item text, and removed lines update the central punch-list document after a short save delay.
- Direct description, room, and item changes in the central document mirror back into the outline.
- Stable codes preserve item IDs and IndexedDB photos through reordering, room renames, and moves between rooms; new lines receive the next unused section number.
- Enter continues the outline, Tab and Shift+Tab change indentation, and Bold, Underline, Strikethrough, Undo, and Redo remain available.
- Word, Markdown, and text files can still seed the outline, and Paste from Word provides the quick first-use path.
- The existing paginated two-by-two photo grid, print preview, issuance history, corrections, project sidebar, and browser-local persistence remain in place.
- The selected option-3 UI is implemented and visually verified at desktop and narrow viewports.
- `npm.cmd test`, `npm.cmd run lint`, and `npm.cmd run build` pass; the test suite has 16 passing tests.
- GitHub Pages now deploys pushes from `codex/living-punch-list-notes` instead of `master` for cross-computer testing.

## In progress
- Publish `codex/living-punch-list-notes` and verify its GitHub Pages workflow run.

## Known issues
- Removing a line from the living outline removes that working item after the save delay; issued snapshots remain intact, but there is no dedicated recovery history for the current draft.
- Item codes in the working draft are derived from the current room name, so changing a room number changes the displayed prefix before the next issuance.
- The issuance model still asks users to understand locks, snapshots, corrections, and direct historical edits; this remains the largest complexity outside the core note/photo/print loop.
- Project data is browser-local and can disappear if browser data is cleared or the user changes devices without exporting a backup.
- A formal issuance can still be recorded with blank project metadata; there is no short preflight.
- The rich outline editor relies on browser content-editing command support for formatting and history.
- The legacy `gh-pages` branch and stale top-level Pages error remain, although the native GitHub Actions deployment succeeds.

## Next actions
1. Open the hosted app on the second computer and paste a representative Word punch list.
2. Exercise repeated add, edit, reorder, and remove cycles with attached photos.
3. Decide whether to simplify the issuance surface now that the core authoring loop is clear.

## How to verify
```text
npm.cmd test
npm.cmd run lint
npm.cmd run build
Open Punch List Notes and add an indented line; confirm it receives the next code and appears in the central document.
Edit that item in the central document; confirm the outline updates without closing the panel.
Attach a photo, reorder the coded line, rename its room, and confirm the photo remains attached.
Delete a line from the outline and confirm the working document removes it after the save delay.
Click Preview / Print PDF; cancel print and confirm the project stays editable and no issuance is added.
git -c safe.directory='G:/Files/Github/Punchlist' status --short --branch
```

## Recent logs
- docs/log/2026-08-13 0954 Publish living notes test branch.md — moved the Pages trigger to the living-notes branch and prepared the complete implementation for GitHub testing.
- docs/log/2026-08-13 0842 Living punch list notes implementation.md — implemented and verified option 3 as a bidirectionally synchronized structural outline.
- docs/log/2026-08-13 0131 Meta-list panel visual correction.md — corrected the mockups so only the right panel evolves while the central document remains intact.
- docs/log/2026-08-13 0112 Living list visual directions.md — generated three complete UI directions for the synchronized outline, photos, and print model.
- docs/log/2026-08-13 0048 Outline as living list.md — framed the outline as a synchronized editor over the item/photo model rather than a repeated import surface.
- docs/log/2026-08-13 0040 Revert first-run import experiment.md — removed the rejected onboarding and outline-editor experiment.
- docs/log/2026-08-12 2320 Complexity and carry-forward review.md — identified issuance as the main source of product drift and proposed a simpler living-project model.
