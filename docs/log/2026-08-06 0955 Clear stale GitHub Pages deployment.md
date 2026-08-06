# 2026-08-06 0955 Clear stale GitHub Pages deployment

## TL;DR
- What changed: Added a one-time workflow hook that cancels the known stale Pages deployment `613e211bd5bf628898a38635ce1dccf8b2205745` when the cleanup commit runs.
- Why: The corrected `master` workflow built and uploaded successfully, but its Pages deployment stayed `deployment_queued` for the full ten-minute timeout. Earlier run logs identify the same stale deployment as the blocker.
- What didn't work: Restoring the branch trigger and native Pages steps alone was not enough because the old Pages deployment still held the queue.
- Next: Push the cleanup commit, confirm the run publishes, then remove the one-time hook and verify a normal master push.

---

## Full notes

- Actions history: runs 2 and 3 on `master` succeeded; run 4 failed at `deploy-pages`; runs 5 and 6 on `main` failed; run 8 succeeded only because it pushed to `gh-pages`.
- Run 4's deployment error said the previous build version `613e211bd5bf628898a38635ce1dccf8b2205745` was still in progress.
- Run 9 on corrected `master` created deployment `84f3f1094aa1bce08546b99fb9788c1de905c8b4`, remained `deployment_queued`, and timed out after ten minutes.
- The cleanup hook uses the workflow's Pages-scoped token and ignores a 404 if the stale deployment has already disappeared.
