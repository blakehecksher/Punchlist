# Spec

## What it is
A construction punch list tool for JBMA (John B. Murray Architect). Used on-site and in the office to document outstanding items by room, attach photos, and print/export to PDF for distribution.

## Why it exists
The original version was built as a Claude artifact (iframe). That context blocked `window.print()` and used a proprietary `window.storage` API. This project moves it into a proper Vite + React app so print/PDF works natively and data persists via standard browser storage.

## Core requirements
- **Print/PDF**: Each page is exactly 11in × 8.5in landscape. What you see on screen = what prints. No items cut across pages.
- **Pagination**: Max 2 item rows on page 1 (site conditions take vertical space); max 3 rows on other pages. Multiple small rooms pack onto one page. Room headers repeat with "(cont'd)" when a room spans pages.
- **Row height**: All item rows on a page fill the available height equally. A page with 3 total rows has 3 equal-height rows regardless of how many rooms those rows belong to.
- **Persistence**: Text/structure → localStorage. Photos (base64) → IndexedDB keyed by item ID.
- **Editing**: All text editable inline. Site conditions, items, and rooms can be added/removed.

## Known hard problem (unresolved as of 2026-03-11)
Row height equalization across multiple rooms on one page. The flex tree is:

```
.page-content
  .room-block (flex: 1)  ← gets 1/2 page
    .items-grid (flex: 1)
      .item-row (flex: 1) ← gets 1/4 page  ← 406 Hall row 1
      .item-row (flex: 1) ← gets 1/4 page  ← 406 Hall row 2
  .room-block (flex: 1)  ← gets 1/2 page
    .items-grid (flex: 1)
      .item-row (flex: 1) ← gets 1/2 page  ← 407 Family Room row 1
```

Result: 407's single row is twice the height of 406's two rows. Fix requires either flattening all item-rows as siblings at the page-content level, or setting `flex` on room-blocks proportional to their row count.
