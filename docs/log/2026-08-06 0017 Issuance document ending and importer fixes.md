# 2026-08-06 0017 Issuance document ending and importer fixes

## TL;DR
- What changed: Standardized four-card pages, added a printed End of Punch List issuance record, made issuance titles editable, added an Issuances jump action, contextualized add-item buttons, fixed full-line formatting and formatted-code imports, and aligned the bottom workspace with sidebar/import layouts.
- Why: The printable document needs a clear ending and a forgiving correction workflow without exposing internal issue numbering or Markdown-like syntax.
- What didn't work: Automated browser triple-click input could not reproduce the native three-click cadence, so the trailing-line-break branch was verified in code while the rest of the editor behavior was exercised in the live preview.
- Next: Add the metadata preflight and destructive-action recovery before broader release.

---

## Full notes

- Removed the visible six-card option and normalized all saved layouts to the two-by-two card geometry.
- Reserved a complete document row for issuance history. When item content fills the last row, pagination creates a clean final page for the record.
- Removed issue stamps from repeated page headers.
- Changed the main issuance action to `Print PDF & issue`; locked snapshots remain available through `Reprint PDF` and the bottom history.
- Defaulted display titles to Punch List, Punch List 2, Correction 1, and so on while allowing any title or a blank title.
- Added a toolbar jump to the bottom Issuances workspace and kept that workspace aligned across sidebar and Import Notes breakpoints.
- Changed add actions to identify the target room and kept General phrased as a note.
- Allowed a triple-clicked item line whose selection includes only a trailing newline.
- Taught the parser to recognize canonical inline HTML around imported issue codes so IDs no longer repeat in descriptions.
- Verified the live preview at `http://127.0.0.4:5175/`, including title editing, final-page history, panel alignment, and zero browser runtime errors.
