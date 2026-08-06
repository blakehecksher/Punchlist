# Spec

## What it is
A general punch list tool for documenting outstanding items by room, attaching photos, and printing or exporting a clean PDF for distribution.

## Why it exists
The original version was built as a Claude artifact (iframe). That context blocked `window.print()` and used a proprietary `window.storage` API. This project moves it into a proper Vite + React app so print/PDF works natively and data persists via standard browser storage.

## Core requirements
- **Print/PDF**: Each page is exactly 11in × 8.5in landscape. What you see on screen = what prints. No items cut across pages.
- **Pagination**: Detail pages use one fixed 2 x 2 layout: four photo cards in two item rows. Multiple small rooms can pack onto one page. Room headers repeat with "(cont'd)" when a room spans pages.
- **Row height**: The two item rows divide the available page content height evenly.
- **Persistence**: Text/structure → localStorage. Photos (base64) → IndexedDB keyed by item ID.
- **Editing**: All text editable inline. Site conditions, items, and rooms can be added/removed.
- **Issue codes**: General uses `GEN-NN`; Exterior without a room number uses `EXT-NN`; other missing room numbers remain `000-NN`. Re-import accepts legacy `GN`, `000`, and `RM` aliases.
- **First-issuance baseline**: Items imported before the first issuance are not automatically underlined. New markers represent items added after an issued baseline.
- **Outline formatting**: Bold, underline, and strikethrough can span one or several item lines. Formatting on room/section headings must not change their structural classification.

## Issuance, revision, and product scope

### Narrow product promise
Punch List is a photo-forward document tool, not a contractor workflow suite. It should make it unusually easy for an architect, inspector, or other author to turn room-based notes into numbered items, attach photos, and hand out a polished PDF. Contractor accounts, assignment queues, “in your court” workflows, notifications, and project-management integrations are out of scope unless the product direction changes explicitly.

### Implemented issue model
The app keeps one living working project and makes every send an immutable issued snapshot within it.

- **Print PDF & issue**: Saves the snapshot, locks the working document, and opens Print/PDF. The toolbar does not expose internal `Issue 01` numbering.
- **Correction path**: An issued project can be unlocked to correct an omission. A Correction title is prefilled, remains editable or blankable, and issuing again preserves the earlier snapshot instead of overwriting it.
- **Next issuance**: Starting the next issuance opens the same living project with the next default Punch List title; that title is also editable or blankable.
- **Screen history**: The bottom Issuances workspace shows lock state, editable display titles, issued date, item count, photo count, and Reprint for every saved snapshot. A toolbar action jumps directly to it.
- **Printed history**: A full-row `End of Punch List` block on the final document page begins at the top-left with a full-width rule and indented issued title/date lines. Ten records fill the first column before a second column begins, supporting twenty issuances without splitting the block. If the final page already uses both item rows, the block starts on a new page.
- **Stable issued document**: Each snapshot preserves document metadata, room names, item text, derived issue codes, layout, and photo versions. Editing an issuance title changes only display metadata, not snapshot contents.
- **Backup portability**: Project backup files include working photos and all issued snapshots.

### Remaining lifecycle work

- **Simple state**: Explicit Open and Closed state is enough for the document product; optional closeout reasons can include Completed, Accepted as-is, Duplicate, or Not applicable.
- **Formatting**: Bold, underline, and strikethrough can remain useful visual conventions, but they should not be the source of truth for item state once explicit state exists.
- **Safe re-import**: Missing items should enter a review step instead of being silently removed from the working record.

The issue model should preserve the narrow printable-document experience. It must not require contractor login, assignment, response, or notification workflows.

## Current layout constraint
JavaScript pagination flattens cards into two full-width document rows so cards remain the same height even when a row crosses room boundaries. The End of Punch List record consumes one complete row and moves to a new page when no complete row remains. Empty sections do not yet consume row budget and remain a known edge case.
