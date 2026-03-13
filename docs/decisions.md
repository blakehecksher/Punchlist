# Decisions

One entry per decision. Format: **what**, why, date. Exists to prevent re-litigating.

---

**Vite + React (not Next.js, not plain HTML)** - lightweight, no server needed, fast HMR, straightforward to deploy as a static build. 2026-03-11

**localStorage for text, IndexedDB for photos** - localStorage has a ~5MB quota which base64 photos blow through immediately. IndexedDB handles binary and large blobs without quota issues. Text data (stripped of photos) stays in localStorage for simplicity. 2026-03-11

**JS-driven pagination (not CSS page-break)** - CSS `page-break-inside: avoid` can prevent cuts but cannot repeat room headers on continuation pages. Pre-computing pages in JS gives full control over layout and header repetition. 2026-03-11

**Fixed page size on screen (11in x 8.5in)** - WYSIWYG: the on-screen view matches the printed page exactly. No surprises at print time. 2026-03-11

**Flex-based row height (not fixed min-height)** - rows should fill the page so the document looks intentional, not like items are floating at the top. Fixed min-height left too much dead space. 2026-03-11

**ROWS_PAGE_1 = 2, ROWS_OTHER = 3** - page 1 has site conditions which consume about one row of vertical space. Other pages only have the compact document header. These values are easy to tune. 2026-03-11

**background-image for photos (not `<img>` + `object-fit: cover`)** - `object-fit: cover` on an `<img>` only pans along the cropped axis, making it impossible to reposition landscape photos in portrait cells. `background-image` with `background-size` and `background-position` gives full two-axis panning at any zoom level. 2026-03-11

**useReducer (not useState) for app state** - the original had many nested `setData(...)` update paths. A reducer with named actions is cleaner, and a `mapItem` helper finds items by ID across general notes and rooms without repeating the nested map logic. 2026-03-11

**Modular file structure** - split the original single file into `styles.css`, `idb.js`, `pagination.js`, `PhotoCell.jsx`, `ItemCard.jsx`, and `PunchListApp.jsx`. Each file has a single responsibility. 2026-03-11

**Word import must preserve list structure (not raw text only)** - office users work in Microsoft Word, and `mammoth.extractRawText(...)` drops the list metadata that the importer needs for bullets, nesting, and section boundaries. Future `.docx` support should read structure first and derive plain text second. 2026-03-12

**Persistent per-section issue sequences (not positional numbering)** - resolved items should be removable without renumbering the remaining open items. General Notes and each room keep their own ever-increasing issue sequence. 2026-03-12

**Summary pages precede detailed pages** - the issued document should open with a dense text-first list of all open items before the photo/detail pages so the GC can scan the whole list quickly. 2026-03-12

**Manual room sorting button by room number (not auto-sort on rename)** - room names should not jump around while the user is typing. Sorting happens only on explicit user action, using the extracted room number as the primary key. 2026-03-13

**Notes copy uses clipboard outline text (not file export)** - the outline should be easy to paste into other tools directly. The copied text stays in the import-friendly bullet format with issue codes, and the importer strips that prefix back off on re-import. 2026-03-13
