# State
_Last updated: 2026-08-01_

## Current focus
Validate the import → automatic IDs → photos → PDF workflow with a real punch
list drafted in Word.

## What's working
- `npm run dev` serves the app locally.
- Pushes to `master` build and deploy via `.github/workflows/deploy.yml`.
- The editor, room/item issue numbering, local photo storage, import/export,
  summary pages, and print pagination are preserved from the prior app.
- The app uses general Punch List language and a neutral workspace shell.
- Importing is merge-only: matching items update, new items are added, and
  existing photos stay attached.
- The import panel accepts pasted outlines plus Word (.docx), Markdown, and
  plain-text notes files.
- Sidebar scrollbars reserve their gutter so punch-list action icons stay aligned
  as the list grows.
- The sidebar fills the viewport without an outer scrollbar; only the punch-list
  list scrolls when its contents exceed the available space.
- Inactive punch-list rows use a light hover state and retain readable text.
- Punch list view controls are labeled by their actual page capacity: 4 Cards
  and 6 Cards.
- New punch lists start blank and teach the intended nested-bullet format before
  presenting Import Notes as the primary action.
- Manual room and item creation remains available inside the document for late
  discoveries, but is not presented as the main workflow.
- Help, import, document settings, and maintenance actions use progressive
  disclosure instead of competing with the editor.
- Photo targets say `Add photo / Click or drag and drop`, are keyboard-accessible,
  and retain print-specific empty wording.
- Photo controls now include a clockwise 90-degree rotate action; the rotated
  image is saved with the item and survives reloads.
- Rotated photos keep intuitive pan direction because their cover fit is
  calculated from the rotated image aspect ratio before zoom is applied.
- The sidebar overlays instead of shifting the print canvas at laptop widths.
- Print / PDF is again the dark primary action in the toolbar.

## In progress
- Real-project validation of Word import, photo drag-and-drop, and re-import.

## Known issues
- `paginateDetail` does not charge empty sections against the page row budget.
  Rows shrink slightly when several empty sections share a page.
- The `u` branch of `containsInlineTag` in `PunchListApp.jsx` is dead code.

## Next actions
1. Import a real `.docx` outline with rooms and nested punch items.
2. Drag representative portrait and landscape photos from a folder onto items.
3. Re-import edited numbered notes and confirm IDs/photos remain attached.

## How to verify
```text
cd "Punch List"
npm.cmd run dev
open http://localhost:5173
npm.cmd run lint
npm.cmd run build
```

## Recent logs
- 2026-08-01 1515 Rotated photo pan direction - corrected aspect-ratio-aware
  cover sizing so panning remains intuitive after rotation.
- 2026-08-01 1450 Rotate photo control - changed the photo reset control to a
  persistent clockwise 90-degree rotation and verified it after reload.
- 2026-08-01 1317 Dummy data - added a separate import-ready Markdown outline
  and 50 verified JPEG stripe test images beside the app.
- 2026-08-01 0304 Import-first workflow - corrected the product hierarchy around
  drafting elsewhere, importing, numbering, adding photos, and printing.
- 2026-08-01 0248 Simplified UX - reduced the interface to the primary
  room/item/photo workflow and documented a screenshot-based UX audit.
- 2026-08-01 Workspace reset - created the general Punch List working copy and
  redesigned its navigation and visual shell.
- 2026-08-01 0216 Import and sidebar polish - simplified importing and reserved
  scrollbar space for stable sidebar alignment.
- 2026-08-01 0219 Sidebar viewport polish - tightened the sidebar layout and
  separated inactive hover styling from the active row.
- 2026-08-01 0225 Card-count labels - renamed the view density controls to show
  their actual cards-per-page counts.
