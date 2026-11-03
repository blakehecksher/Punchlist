# 2026-11-03 1200 Backup reconnect layout

## TL;DR
- What changed: the backup action flex container wraps; Reconnect has a 100% flex basis.
- Why: a pending folder adds a third button to a narrow, non-wrapping row and pushes Use Downloads outside the card.
- What didn't work: local Git clone was blocked by network resolution; access to the existing Edge window was not approved.
- Next: run repository CI, review the CSS change, and merge before hosted verification.

---

## Full notes

The user requested a small code fix for the reconnect state. ProjectSidebar.jsx already renders the right controls conditionally; the defect is in styles.css. Added flex-wrap: wrap to .sidebar-backup-folder-actions and flex-basis: 100% to .sidebar-backup-folder-btn--primary. Reconnect therefore occupies the first row, leaving Change and Use Downloads below; wrapping also allows those controls to split further if needed. The granted and default states retain their existing controls.

No changes to permission requests, folder selection, download fallback, labels, or backup files. No implementation-mirroring tests added for this two-declaration CSS fix. Existing CI runs tests, lint, typecheck, and build on the pull request. Visual verification of the live reconnect state remains a manual check.
