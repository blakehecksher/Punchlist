# 2026-03-12 2251 IssueIdsAndSummary

## TL;DR
- What changed: Added persistent per-section issue sequences, summary pages ahead of detailed pages, and detail pagination that no longer wastes the first detailed page when Site Conditions already live on the summary page.
- Why: The issued document needed stable identifiers across reissues and a faster text-first overview before the photo-heavy detail pages.
- What didn't work: The in-progress branch still treated `pages` as a flat segment array, and the first detailed page was incorrectly using the reduced Site Conditions row count.
- Next: Validate the summary-first document with real projects and decide on the final end-of-list disclaimer language.

---

## Full notes

- Added `src/issueIds.js` to normalize missing `issueSeq` values and format persistent issue codes for General Notes and rooms.
- Updated item creation, import, duplication/load normalization, and add-item flows so new items keep an ever-increasing `issueSeq` within General Notes or a given room.
- Switched visible item labels from positional `Item #NN` numbering to stable issue codes in both the summary and detailed item cards.
- Split pagination into `paginateSummary(...)` and `paginateDetail(...)`, then assembled the document as summary pages first and detailed pages second.
- Added summary-page rendering and table styling for a dense text-only open-items overview.
- Fixed the detail paginator so if summary pages already carry Site Conditions, the first detailed page gets the full non-first-page row capacity.
- Fixed page-segment bookkeeping so first/last section chunk logic still works after `pages` became `{ kind, segments }` objects.
- Verified with `npm run build` and `npx eslint src`.
