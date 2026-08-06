# 2026-08-06 1034 GitHub Pages stale deployment lock

## TL;DR
- What changed: Confirmed `master` is the repository branch and restored the native GitHub Pages Actions workflow. Reset the authenticated Pages metadata to `workflow` with `master` as its saved source, removed temporary diagnostic/cleanup hooks, and pushed commit `be5f4b5` to `origin/master`.
- Why: The merged release had been redirected through `main`, and a later workflow published with `peaceiris/actions-gh-pages` to `gh-pages`, which did not match the requested GitHub Actions Pages source.
- What didn't work: Actions run 15 passed checkout, install, build, Pages configuration, and artifact upload, but the Pages deployment stayed `deployment_in_progress` for the full ten-minute timeout. GitHub's cancel endpoint returned success while the deployment status remained in progress; deleting the Pages site returned `422`.
- Next: Unpublish and re-enable Pages as `GitHub Actions` in the repository's Settings > Pages UI, then rerun the clean workflow from `master`.

---

## Full notes

- Repository default branch is `master`; PR 1 merged into `master`.
- The original native workflow was changed to trigger on `main`, then replaced with a `gh-pages` branch-publishing action. That explains why a merge to `master` stopped publishing and why selecting GitHub Actions did not match the workflow.
- The current workflow triggers on `master`, uses `pages: write` and `id-token: write`, builds `dist`, uploads the Pages artifact, and calls `actions/deploy-pages@v4`.
- GitHub Pages metadata currently reports `build_type: workflow`, source branch `master`, source path `/`, and URL `https://blakehecksher.github.io/Punchlist/`.
- Run 15 (`31110115066`) used commit `be5f4b5`. The build completed successfully, but deployment `be5f4b5...` remained in progress until the action timed out and canceled its job.
- The public site still serves the previous successful publication from 04:55 UTC. The source and workflow are ready; the remaining issue is server-side Pages state that needs the UI reset.
