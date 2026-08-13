# 2026-08-13 0954 Publish living notes test branch

## TL;DR
- What changed: Created `codex/living-punch-list-notes` and changed GitHub Pages deployment to run from that branch instead of `master`.
- Why: The living Punch List Notes workflow needs to be tested on another computer through the hosted app before it replaces the stable branch.
- What didn't work: The GitHub CLI's saved token is stale, so workflow inspection through `gh` is unavailable; the repository's normal Git credentials are being used for the branch push.
- Next: Verify the branch push and its Pages workflow run, then test the hosted URL from the second computer.

---

## Full notes

- Preserved `master` as the current stable branch.
- Included the living outline implementation, regression tests, visual QA evidence, audit notes, decisions, and session logs in the test branch.
- Updated `.github/workflows/deploy.yml` so a push to `codex/living-punch-list-notes` builds and deploys `dist` through GitHub Pages.
- Kept `workflow_dispatch` available for manual reruns.
