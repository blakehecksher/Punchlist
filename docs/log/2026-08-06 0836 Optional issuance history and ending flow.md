# 2026-08-06 0836 Optional issuance history and ending flow

## TL;DR
- What changed: Added a `Show issuances` Document Settings checkbox and removed the document ending's bottom pinning.
- Why: Users need an opt-out for printed issuance history, and the ending should consume the next available two-card row instead of leaving a blank row above it.
- What didn't work: Testing from the locked example required a temporary blank project; it was removed after verification.
- Next: Continue with the remaining issue preflight and recovery work.

---

## Full notes

- Extended normalized persisted layout settings with `showIssuances: true`, preserving the visible history for older projects.
- Hid only the dated issuance lines when the setting is off. `End of Punch List` and the bottom Issuances workflow remain visible.
- Removed `margin-top: auto` from the ending row so pagination order controls placement.
- Verified the checkbox off/on states in an editable project, confirmed the issuance workspace remains, and restored the default before deleting the temporary project.
- Compared the live ending against the annotated screenshot and confirmed it follows the prior item row without a blank reserved row.
- `npm.cmd run lint` and `npm.cmd run build` pass; a fresh browser session reports no console errors.
