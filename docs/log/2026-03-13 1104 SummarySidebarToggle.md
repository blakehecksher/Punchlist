# 2026-03-13 1104 SummarySidebarToggle

## TL;DR
- What changed: Added a per-project `Summary` checkbox in the sidebar layout controls and made the document skip all summary pages when it is unchecked.
- Why: The summary-first flow needed to be optional so staff can issue detail-only punch lists without removing the underlying summary feature.
- What didn't work: `npm`/`npx` PowerShell shims were blocked by execution policy, and the sandboxed build hit an `esbuild` spawn `EPERM`; verification succeeded with `npx.cmd eslint src` and an escalated `npm.cmd run build`.
- Next: Check the browser and print/PDF flow with summary on and off against a real project.

---

## Full notes

- Extended the persisted layout model in `src/layout.js` with `showSummary`, defaulting to `true` so existing projects keep the current behavior unless the user turns it off.
- Updated `src/ProjectSidebar.jsx` to add a second layout checkbox labeled `Summary` directly under `Show photos`.
- Changed `src/PunchListApp.jsx` so summary pagination only runs when `layout.showSummary` is enabled.
- Left the existing detail pagination rule intact by deriving `includeSiteConditions` from whether summary pages are present, so turning summary off returns Site Conditions to the first detail page automatically.
- Verified `npx.cmd eslint src` passes.
- Verified `npm.cmd run build` passes after rerunning outside the sandbox.
