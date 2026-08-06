# 2026-08-05 2125 Example onboarding build

## TL;DR
- What changed: Implemented the selected example-project onboarding direction, a full-height right-side notes workspace, and the handoff into a separate personal punch list.
- Why: Give first-time users a safe, realistic project to explore while making long note import comfortable and obvious.
- What didn't work: A reused browser origin initially showed stale first-run storage, and the personal-project import panel initially repopulated sample notes; the final QA used a clean origin and the duplicate-import risk was removed.
- Next: Enable GitHub Pages and continue the remaining release-readiness work.

---

## Full notes

- Added a clearly labeled 184 Cedar Avenue practice project with Northline Studio placeholder data and realistic punch items.
- Added a fixed example banner and a prominent Start your punch list action.
- Rebuilt note import as a full-height, scrollable right workspace with a large editor, formatting primer, file loading, and a persistent action footer.
- Starting from the example creates a separate personal project; edits to the example remain isolated.
- Personal and newly blank projects now open an empty import editor rather than preloading sample notes.
- Updated the toolbar and project switcher to identify the example consistently.
- Matched the selected reference at 1440 × 1024, saved the side-by-side comparison, and recorded a passing `design-qa.md`.
- Verified the primary handoff in the browser with no console warnings or errors; lint and production build pass.
