# 2026-08-12 0903 Edit any issued version

## TL;DR
- What changed: Fix issued version now acts on the selected snapshot, with direct-edit and create-correction choices for any issuance in the history.
- Why: The product should let users manage their records without enforcing a distribution-based correction policy.
- What didn't work: A positional browser selector hit the wrong repeated action; the final check used the selected issuance region and completed cleanly.
- Next: Add automated browser coverage for saving an edited older snapshot and creating a correction from an older version.

---

## Full notes

- Added direct editing for any issued snapshot selected from the sidebar.
- Direct edits update the selected snapshot in place while preserving its ID, date, issue number, revision, and location in history.
- Editing an older snapshot does not overwrite the current working document or any other issuance.
- Editing the latest locked snapshot also updates the matching current locked document.
- Photo changes made during a snapshot edit stay isolated from the current working photo store until the edited snapshot is saved.
- Added Save issued version and Cancel actions in both the fixed edit banner and Issuances workspace.
- Create correction from this version starts from the selected snapshot rather than always using the latest issuance.
- Replaced the prior distribution question with neutral direct-edit and correction choices.
- Added lifecycle tests for correction-from-selected and replacement of only the selected record.
- Verified the older Correction 1 snapshot can enter editable mode and cancel back to the current Correction 3 draft without changing project data.
