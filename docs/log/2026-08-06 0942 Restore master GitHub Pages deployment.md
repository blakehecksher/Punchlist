# 2026-08-06 0942 Restore master GitHub Pages deployment

## TL;DR
- What changed: Restored the native GitHub Actions Pages workflow, switched its push trigger back to `master`, and aligned local `master` with the merged remote history.
- Why: GitHub's default branch is `master`, but the last release workflow listened to `main` and pushed a build to `gh-pages`, which does not match the repository's GitHub Actions Pages source.
- What didn't work: The first local remote fetch was blocked by the restricted network; the approved retry succeeded. Local lint and production build both passed.
- Next: Confirm the first `master`-triggered Pages run and live URL update.

---

## Full notes

- GitHub repository metadata reports `master` as the default branch; the repository currently contains `master`, `main`, and legacy `gh-pages` branches.
- Pull request #1 was merged from `main` into `master`.
- Commit `b90129d` changed the workflow from the native Pages artifact/deploy actions to `peaceiris/actions-gh-pages`, changed the permissions to `contents: write`, and retained a `main` push trigger.
- Restored `.github/workflows/deploy.yml` to use `master`, `contents: read`, `pages: write`, and `id-token: write`, followed by `configure-pages`, `upload-pages-artifact`, and `deploy-pages`.
- Updated the project state to document `master` as the publishing source. The existing `gh-pages` branch was left intact as historical data and is not used by the current Pages source.
- Verified with `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check`.
