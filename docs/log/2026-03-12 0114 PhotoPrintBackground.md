# 2026-03-12 0114 PhotoPrintBackground

## TL;DR
- What changed: Removed the black `has-photo` background fill from photo cells so uncovered areas show the page background instead.
- Why: Landscape photos and aggressive pan/zoom were printing visible black bars where the image no longer covered the whole cell.
- What didn't work: The previous `background: #000` styling made empty photo-cell space stand out in print/PDF output.
- Next: Verify the print/PDF result with a few real landscape and panned photos in the browser workflow staff uses.

---

## Full notes

- Updated `src/styles.css` so `.photo-cell.has-photo` uses a transparent background instead of black while preserving the grab cursor behavior.
- Kept the change narrowly scoped to the photo-cell presentation; no pagination or photo-position logic changed.
- Ran `npm run build` after the CSS edit to confirm the production bundle still builds cleanly.
