# 2026-08-06 0957 Fix Pages cleanup request

## TL;DR
- What changed: Replaced the unavailable `cancelPagesDeployment` Octokit helper with a raw authenticated GitHub API request in the one-time cleanup hook.
- Why: The first cleanup run had the correct token and permission but failed before making the request because the bundled Octokit client did not expose that newer endpoint helper.
- What didn't work: Cleanup run #10 stopped at the cleanup step; the Pages deployment was not touched and the deploy step was skipped.
- Next: Push this correction and confirm the stale deployment is canceled before `deploy-pages` runs.

---

## Full notes

- The failed run downloaded `actions/github-script@v7` and showed `Pages: write` in the job token permissions.
- The error was `TypeError: github.rest.repos.cancelPagesDeployment is not a function`.
- The hook now calls `POST /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id}/cancel` through `github.request`, using the known stale deployment SHA.
