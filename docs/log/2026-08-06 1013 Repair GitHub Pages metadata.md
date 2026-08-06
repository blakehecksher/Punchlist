# 2026-08-06 1013 Repair GitHub Pages metadata

## TL;DR
- What changed: Added a one-time authenticated Pages API update that preserves `build_type: workflow` and resets the saved source metadata to branch `master` at `/`.
- Why: The diagnostic reports `status: errored` and `source.branch: gh-pages` even though Pages is in workflow mode.
- What didn't work: The source mode alone did not clear the unhealthy Pages state; run #11 still timed out after entering `deployment_in_progress`.
- Next: Push the repair, confirm the API update and a normal deployment, then remove all temporary hooks.

---

## Full notes

- Run #13 completed successfully after logging the authenticated Pages site response.
- The response reported `build_type: workflow`, `source: { branch: gh-pages, path: / }`, and `status: errored`.
- The repair uses the Pages API `PUT /repos/{owner}/{repo}/pages` with `build_type: workflow` and `source: { branch: master, path: / }`.
