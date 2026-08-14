# 2026-08-14 1325 Publish simplified workflow branch

## TL;DR
- What changed: Prepared the reviewed simplification as a focused Git branch for GitHub merge.
- Why: The simplified one-document workflow should become the hosted version going forward.
- What didn't work: The GitHub CLI login had expired, so publication uses the repository's normal Git credentials instead of creating the pull request automatically.
- Next: Merge `codex/simple-punch-list` into `master` on GitHub and verify the hosted app.

---

## Full notes

- The branch is based on the latest remote `master` available when implementation began.
- The complete change set includes the issuance-workflow removal and the reviewed editable End of Punch List controls.
- Lint, all 15 tests, the production build, and live browser behavior passed before publication.
