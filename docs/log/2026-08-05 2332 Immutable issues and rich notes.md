# 2026-08-05 2332 Immutable issues and rich notes

## TL;DR
- What changed: Replaced markdown-marker editing with a true rich outline editor; added immutable issued snapshots, project locking, correction reissues, next-issue flow, the bottom Issuances history, historical reprint recovery, and snapshot-aware backups.
- Why: Authors need the notes panel to show real formatting and need to correct an issued document without silently rewriting or duplicating the project record.
- What didn't work: The in-app browser did not consistently fire `afterprint` after a historical reprint, so the flow now includes a visible Return to working list action and removes any pending after-print listener when used.
- Next: Add issue metadata preflight and recovery/review for destructive working-copy changes.

---

## Full notes

- Added `OutlineEditor.jsx`, a content-editable multiline outline that preserves bullet indentation and inline bold, underline, italic, and strikethrough HTML.
- Toolbar buttons and Ctrl+B, Ctrl+U, and Ctrl+Shift+X apply visible styling directly to selected text. Imported Word/Docs formatting remains compatible with the existing outline parser.
- Removed the redundant formatting example and added supported file types to the primer.
- Added IndexedDB issue snapshot storage alongside photos. Each issue snapshot includes document structure, layout, item text, room names, issue-code inputs, and photo data.
- Issue & Print locks the project. Unlock to correct creates a correction draft; Reissue & Print records a Correction snapshot that supersedes but does not delete the original. Start next issue advances the number.
- Added a bottom Issuances group with state guidance, issue history, counts, and Reprint.
- Backup file version 2 includes issued snapshots and restores them with the project.
- Updated How it works, `docs/spec.md`, `docs/decisions.md`, and the issuance audit to match the implemented flow.
- Verified lint and production build. In the live app, verified Issue 01 locking, correction reissue/history preservation, Issue 02 startup, historical reprint recovery, and responsive footer layout at the 1378 × 920 review viewport.
