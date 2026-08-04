# 2026-08-04 0116 GitHub Pages setup

## TL;DR
- What changed: Initialized the local project as Git, added the GitHub remote, ignored local dev logs, committed the app, and pushed `master` to `blakehecksher/Punchlist`.
- Why: The remote repository was empty and needed the app plus its existing Pages workflow before it could deploy.
- What didn't work: The browser was signed out of GitHub, so Pages source selection could not be completed in the UI.
- Next: Select GitHub Actions under repository Settings → Pages, then wait for the deployment workflow.

---

## Full notes

- Verified `npm.cmd run lint` succeeds.
- Verified `npm.cmd run build` succeeds and emits relative asset URLs.
- Initial commit: `430628b Set up GitHub Pages deployment`.
- Remote branch: `master`.
- Expected Pages URL: `https://blakehecksher.github.io/Punchlist/`.
