# Decisions

One entry per decision. Format: **what**, why, date. Exists to prevent re-litigating.

---

**Vite + React (not Next.js, not plain HTML)** — lightweight, no server needed, fast HMR, straightforward to deploy as a static build. 2026-03-11

**localStorage for text, IndexedDB for photos** — localStorage has a ~5MB quota which base64 photos blow through immediately. IndexedDB handles binary/large blobs without quota issues. Text data (stripped of photos) stays in localStorage for simplicity. 2026-03-11

**JS-driven pagination (not CSS page-break)** — CSS `page-break-inside: avoid` can prevent cuts but can't repeat room headers on continuation pages. Pre-computing pages in JS gives full control over layout and header repetition. 2026-03-11

**Fixed page size on screen (11in × 8.5in)** — WYSIWYG: the on-screen view matches the printed page exactly. No surprises at print time. 2026-03-11

**Flex-based row height (not fixed min-height)** — rows should fill the page so the document looks intentional, not like items are floating at the top. Fixed min-height (160px) left too much dead space. 2026-03-11

**ROWS_PAGE_1 = 2, ROWS_OTHER = 3** — page 1 has site conditions which consume ~1 row of vertical space. Other pages only have the compact doc header. These values are easy to tune. 2026-03-11

**background-image for photos (not `<img>` + `object-fit:cover`)** — `object-fit:cover` on an `<img>` only pans along the cropped axis, making it impossible to reposition landscape photos in portrait cells. `background-image` with `background-size`/`background-position` gives full two-axis panning at any zoom level. 2026-03-11

**useReducer (not useState) for app state** — the original had 10+ `setData(d => ({ ...d, rooms: d.rooms.map(...) }))` patterns. A reducer with named actions is cleaner and a `mapItem` helper finds items by ID across generalNotes and rooms without repeating the nested-map logic. 2026-03-11

**Modular file structure** — split the original 990-line single file into `styles.css`, `idb.js`, `pagination.js`, `PhotoCell.jsx`, `ItemCard.jsx`, `PunchListApp.jsx`. Each file has a single responsibility. 2026-03-11
