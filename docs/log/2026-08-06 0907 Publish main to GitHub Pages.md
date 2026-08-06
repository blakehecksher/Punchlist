# 2026-08-06 0907 Publish main to GitHub Pages

## TL;DR
- What changed: Created the `main` release branch and changed the GitHub Pages workflow to deploy from it.
- Why: The published site should track the requested main branch.
- What didn't work: Nothing.
- Next: Keep the public build healthy as product work continues.

---

## Full notes

- Created `main` directly from the verified `master` commit.
- Updated the existing Pages action to trigger from `main`.
- Reused the successful lint and production-build verification from the release candidate.
- Published the static Vite build at `https://blakehecksher.github.io/Punchlist/`.
