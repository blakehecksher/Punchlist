# 2026-03-11 2242 OutlineImport

## TL;DR
- What changed: Extended the importer to accept nested bullet or numbered outlines like the field-note format used on site, and updated the import drawer instructions to show that format.
- Why: Real punchlist notes are often captured as a single outline instead of markdown headings, so the importer needed to match the actual workflow.
- What didn't work: No new blocker in the active app path; legacy lint issues in `PunchList_925Park.jsx` still exist from before.
- Next: Test the outline importer with a few real note variants to see if room-name normalization or nested item flattening needs tuning.

---

## Full notes

- `src/importParser.js` now supports two import styles:
  - heading-based markdown/plain text
  - nested bullet or numbered outlines where top-level bullets are sections and nested bullets are items
- The importer now ignores `Site Conditions` in outline mode and skips orphan top-level bullets with no children, which covers title lines like `Punchlist at 03/11/26 9:30-11:00`.
- Nested sub-bullets under an item are flattened into a single item description, joined with `: ` and `; ` separators.
- `src/PunchListApp.jsx` import help text and example now show the outline format first, while noting that markdown headings still work.
- Verification:
  - `npm run build` passed
