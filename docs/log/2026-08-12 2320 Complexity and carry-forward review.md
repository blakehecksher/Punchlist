# 2026-08-12 2320 Complexity and carry-forward review

## TL;DR
- What changed: Added a screenshot-backed audit of the current first-run, photo-grid, project-navigation, and issuance experience. No application code changed.
- Why: The product had drifted from a simple grid of punch-list items with photos into a user-managed issuance and correction system.
- What didn't work: The issuance model solves archival edge cases but makes formal document lifecycle a second core product.
- Next: Decide whether to replace issuance UI with one living project, simple Open/Done item state, automatic carry-forward, and consequence-free PDF export.

---

## Full notes

- Captured the current import workspace, example document, item/photo grid, project panel, and issuance workspace.
- The strongest core interaction remains the numbered item beside a large photo target.
- The main sources of complexity are the outline-editor front door, editing directly inside paginated print pages, and user-managed issuance/correction history.
- The recommended longitudinal model is stable item records in one living project: open items carry forward automatically; done items are archived but recoverable; PDF export does not mutate state.
- The main application gained roughly 1,200 lines and the stylesheet roughly 1,000 lines since the pre-issuance baseline, confirming the issuance layer is a substantial product surface rather than a small export feature.
- Full review: `docs/audits/2026-08-12-complexity-review/README.md`.
