# Decisions

One entry per decision. Format: **what**, why, date. Exists to prevent re-litigating.

---

**Vite + React (not Next.js, not plain HTML)** - lightweight, no server needed, fast HMR, straightforward to deploy as a static build. 2026-03-11

**localStorage for text, IndexedDB for photos** - localStorage has a ~5MB quota which base64 photos blow through immediately. IndexedDB handles binary and large blobs without quota issues. Text data (stripped of photos) stays in localStorage for simplicity. 2026-03-11

**JS-driven pagination (not CSS page-break)** - CSS `page-break-inside: avoid` can prevent cuts but cannot repeat room headers on continuation pages. Pre-computing pages in JS gives full control over layout and header repetition. 2026-03-11

**Fixed page size on screen (11in x 8.5in)** - WYSIWYG: the on-screen view matches the printed page exactly. No surprises at print time. 2026-03-11

**Flex-based row height (not fixed min-height)** - rows should fill the page so the document looks intentional, not like items are floating at the top. Fixed min-height left too much dead space. 2026-03-11

**ROWS_PAGE_1 = 2, ROWS_OTHER = 3** - page 1 has site conditions which consume about one row of vertical space. Other pages only have the compact document header. These values are easy to tune. 2026-03-11

**Site-condition first page = one item row or none** - when site conditions are rendered on a detail page, the first page may carry one punch-list row (two cards) at most. If more than six site-condition rows are present, the first page is reserved for site conditions and punch-list items begin on the following page. This supersedes the earlier fixed two-row first-page behavior. 2026-08-11

**background-image for photos (not `<img>` + `object-fit: cover`)** - `object-fit: cover` on an `<img>` only pans along the cropped axis, making it impossible to reposition landscape photos in portrait cells. `background-image` with `background-size` and `background-position` gives full two-axis panning at any zoom level. 2026-03-11

**useReducer (not useState) for app state** - the original had many nested `setData(...)` update paths. A reducer with named actions is cleaner, and a `mapItem` helper finds items by ID across general notes and rooms without repeating the nested map logic. 2026-03-11

**Modular file structure** - split the original single file into `styles.css`, `idb.js`, `pagination.js`, `PhotoCell.jsx`, `ItemCard.jsx`, and `PunchListApp.jsx`. Each file has a single responsibility. 2026-03-11

**Word import must preserve list structure (not raw text only)** - office users work in Microsoft Word, and `mammoth.extractRawText(...)` drops the list metadata that the importer needs for bullets, nesting, and section boundaries. Future `.docx` support should read structure first and derive plain text second. 2026-03-12

**Persistent per-section issue sequences (not positional numbering)** - resolved items should be removable without renumbering the remaining open items. General Notes and each room keep their own ever-increasing issue sequence. 2026-03-12

**Summary pages precede detailed pages** - the issued document should open with a dense text-first list of all open items before the photo/detail pages so the GC can scan the whole list quickly. 2026-03-12

**Manual room sorting button by room number (not auto-sort on rename)** - room names should not jump around while the user is typing. Sorting happens only on explicit user action, using the extracted room number as the primary key. 2026-03-13

**Unnumbered rooms get a "000" issue prefix (not "RM")** - a room with no number in its name is a data-entry mistake, not a category. "000" sorts the room to the top of the document, reads as an obvious blank rather than a legitimate code, and takes one edit to fix. The room header also carries a screen-only "Add room no." flag so the mistake is visible where it can be corrected. Notes copied before this change still carry "RM-NN" codes, so merge import matches both forms. 2026-07-29

**Notes copy uses clipboard outline text (not file export)** - the outline should be easy to paste into other tools directly. The copied text stays in the import-friendly bullet format with issue codes, and the importer strips that prefix back off on re-import. 2026-03-13

**New punch lists start blank (not with a full sample document)** - the product's primary job is converting a room-and-item outline drafted elsewhere into an automatically numbered photo document. A five-page example made the first experience look complete and complex before the user had imported anything. Formatting help and a copyable outline remain available on demand. 2026-08-01

**Import-first workflow (not in-app drafting-first)** - users should write the substantive punch list in Word, Notes, or another capable editor using top-level room bullets and indented item bullets. Punch List exists to import that structure, assign persistent IDs, attach photos quickly, and publish the document. Direct room/item editing stays available for late discoveries rather than leading the experience. 2026-08-01

**Closed items are archived records (not deleted rows)** - a punch item is part of the project record after it leaves the active list. Closure must preserve its issue number, evidence, responsible party, responses, status history, reviewer, date, and disposition, including accepted-as-is or unfixable outcomes. 2026-08-04

**Completion is an explicit reviewed lifecycle (not strikethrough formatting alone)** - the responsible contractor or trade responds to an assigned item, and the architect, inspector, or other authorized reviewer closes or accepts it where review is required. The active list and historical log are separate views of the same record. 2026-08-04

**First run opens an isolated editable example, then creates a separate real project** - this supersedes the earlier blank-first onboarding decision without changing the import-first workflow. A clearly labeled fictional project lets new users explore the finished product safely; replacing its starter outline and choosing Import & build creates a separate personal punch list, so practice changes never leak into real work. 2026-08-05

**Punch List is a photo-forward printable-document tool, not a contractor workflow suite** - the core problem is attaching photos to numbered punch items and producing a clean PDF that can be handed out. Contractor accounts, assignments, “in your court” queues, notifications, and broader project-management workflows are outside the current product scope. 2026-08-05

**One living project with locked immutable issues and preserved correction snapshots** - Issue & Print saves the exact document and photos, locks the working copy, and records the issue at the bottom of the project. Unlocking is allowed for accidental omissions, but Reissue & Print creates a Correction snapshot and supersedes the earlier record instead of silently rewriting it. Start next issue opens the next numbered working round. 2026-08-05

**One fixed four-card detail layout (not a user-selectable six-card density)** - the two-by-two card size is the smallest reliable photo-and-description format for a document meant to be printed and handed out. The card-count control is removed, and older saved density values normalize to four cards. This supersedes the earlier three-row density option. 2026-08-06

**Issued snapshots end the printable document and keep editable display titles** - the document header stays limited to project metadata. A full-width row at the end of the final page says `End of Punch List` and lists each issued title and date; it starts a new page when the last item row is occupied. Snapshot content and photos remain immutable, while the display title defaults to Punch List/Correction numbering and can be edited or cleared as metadata. 2026-08-06

**GEN for General and EXT for Exterior, with legacy aliases preserved** - the longer prefixes are clearer on a printed document. Exterior is a valid named area and no longer shows the missing-room-number warning. Re-import continues to recognize older GN, 000, and RM codes so the naming change does not duplicate existing items. 2026-08-06

**New markers describe change since the prior issuance, not presence in the first import** - a clean first punch list is the baseline, so its automatically numbered items are not underlined. Opening a correction or the next issuance clears the previous new markers; items added after that point may be marked new. 2026-08-06

**Rich formatting may span several outline items** - the editor no longer enforces one-item selections. Formatting is serialized as balanced markup on each line, and formatting around a bullet or section heading is normalized before structural parsing so visual styling cannot corrupt the room/item hierarchy. 2026-08-06

**The document ending flows as one normal row and its history is optional** - `End of Punch List` consumes the next available full-width row instead of pinning itself to the page bottom. Document Settings may hide the dated issuance lines, but the ending title and the screen-only issuance workflow remain available. Older saved projects show the history by default. 2026-08-06

**PDF preview is consequence-free; formal issuance is an explicit record** - Preview / Print PDF never locks the project or creates history. Record as issued deliberately creates the immutable snapshot. If the latest copy was not distributed, it may be reopened and replaced; if it was distributed, the next change must be a formal correction. Issued snapshots remain children of the living project in the sidebar so historical navigation does not compete with project navigation. This refines the earlier locked-issue decision without weakening snapshot immutability. 2026-08-12

**Any selected issuance may be edited directly or used to create a correction** - the app does not decide whether a prior PDF must remain immutable based on distribution. Fix issued version applies to the snapshot the user selected, including older versions. Edit this issued version replaces that stored snapshot in place while preserving its ID, date, number, and history position; Create correction from this version preserves the snapshot and opens a correction based on it. This supersedes the distribution-gated replacement rule above. 2026-08-12

**Punch List Notes is the living structural editor, not a repeat importer** - Word, Docs, or a notes file can bootstrap the first list, but subsequent authoring happens in the persistent right-side outline. Its room headings, indentation, order, item text, and omissions drive the central photo document; direct document edits mirror back into the outline. Stable item codes reconnect hidden item IDs so reordering, room renaming, and moving items preserve photos. This supersedes the import-first and Import & build workflow decisions while keeping the initial paste advantage. 2026-08-13
