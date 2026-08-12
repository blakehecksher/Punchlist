# 2026-08-12 0122 Separate preview and issuance

## TL;DR
- What changed: Split PDF preview from formal issuance, added nested sidebar snapshots, introduced a read-only snapshot view, and added a distributed/not-distributed fix choice.
- Why: Draft PDFs need to be printed and shared for review without accidentally creating correction history.
- What didn't work: The first visual capture left the sidebar collapsed; it was recaptured in the intended expanded state before design QA.
- Next: Add automated browser coverage for preview printing, formal issuance, snapshot navigation, and the two fix branches.

---

## Full notes

- `Preview / Print PDF` now invokes print without mutating issuance state.
- `Record as issued` is the only action that creates an immutable snapshot and locks the working copy.
- The active project exposes its issued versions as indented sidebar children, including a Latest marker.
- Historical snapshots open read-only and retain a direct Reprint action plus an explicit return to the current document.
- `Fix issued version` asks whether the issued copy was distributed:
  - Not distributed reopens and removes the latest snapshot so it can be replaced.
  - Already distributed opens a formal correction draft.
- The detailed issuance list is collapsed behind Manage issued versions to keep the bottom workspace focused.
- Added lifecycle unit tests for reopening a first issuance and reopening a correction at the same level.
- Verified 12 tests, lint, production build, `git diff --check`, and a clean post-reload browser console.
- Product Design QA compared the annotated source and implementation at 1119 x 920 in one side-by-side image and passed.

