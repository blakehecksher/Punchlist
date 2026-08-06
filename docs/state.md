# State
_Last updated: 2026-08-06_

## Current focus
Maintain the release-ready import-to-issued-PDF workflow with predictable numbering, formatting, correction history, and reliable GitHub Pages publishing from `master`; clear GitHub's stale Pages deployment record and confirm a fresh publication.

## What's working
- The local Vite/React app passes `npm.cmd run lint` and `npm.cmd run build`.
- Detail pages use one fixed four-card (2 x 2) layout; older saved six-card layouts migrate automatically.
- General items use `GEN-NN`; an unnumbered Exterior section uses `EXT-NN`. Old `GN`, `000`, and `RM` exports still match during re-import.
- A clean first import is treated as the baseline and shows zero new items. Opening a correction or the next issuance clears prior new markers; items added afterward can be underlined as new.
- Import Notes displays Bold, Underline, and Strikethrough directly in the editor and document through the toolbar or Ctrl+B, Ctrl+U, and Ctrl+Shift+X.
- Formatting can span several item lines. Serialization balances formatting tags per line so bullets remain parseable.
- Formatted section headings such as underlined General or bold Exterior are normalized back to their proper section names.
- Re-import recognizes formatted issue-code prefixes and removes the prefix from descriptions instead of duplicating it.
- `Print PDF & issue` creates a dated immutable snapshot, stores its document and photos, locks the project, and opens Print/PDF.
- Unlock to correct opens an editable Correction draft; correction and punch-list titles are prefilled, editable, and may be blank.
- The final printed page contains a top-left `End of Punch List` record with a full-width rule and indented issuance lines. Ten records fill the first column before a second column begins.
- The ending consumes the next available full-width document row instead of pinning itself to the bottom of the page.
- Document Settings includes `Show issuances`; turning it off keeps `End of Punch List` but hides its dated history. Existing projects default to showing the history.
- The screen-only Issuances workspace remains at the bottom with a toolbar jump action, lock/correction controls, editable titles, dates, counts, and Reprint.
- Sidebar and Import Notes states keep the Issuances workspace aligned with the document.
- The production build is pushed to `master` and the native GitHub Actions Pages workflow is correct; the latest remote commit is `be5f4b5`.
- The authenticated Pages record is set to `build_type: workflow` with `source.branch: master` and `source.path: /`.

## In progress
- Remaining release-readiness improvements: Print/PDF metadata preflight, destructive-action recovery, local-save/backup messaging, and a stronger existing-project import-success handoff.
- GitHub Actions run 15 built, configured, and uploaded the Pages artifact successfully, but the Pages handoff remained `deployment_in_progress` for ten minutes and failed.
- The Pages API still reports the recent deployment records as `deployment_in_progress`; the Actions cancel calls return success without clearing those records, and deleting the Pages site returns `422`.
- A manual GitHub Pages unpublish/re-enable in Actions mode is required to clear the server-side lock before rerunning the normal `master` workflow.

## Known issues
- The legacy `gh-pages` branch remains in the repository for deployment history but is no longer used by the GitHub Actions Pages source.
- The public Pages URL still serves the last successful early-morning deployment until GitHub clears its stale deployment records.
- Item codes in the working draft are derived from the current room name; each issued snapshot is stable, but the live code can change before the next issuance.
- Bold and strikethrough still influence revised/completed counts; explicit lifecycle state is not implemented.
- Re-import can remove missing working items, and direct item/room removal has no visible recovery path. Issued snapshots remain intact.
- Print/PDF can still be issued with blank project metadata; there is no short preflight yet.
- Local-only persistence and the importance of downloading a backup are not explained prominently.
- `paginateDetail` does not charge empty sections against the page row budget.
- The rich outline editor relies on the browser's content-editing command support for formatting.

## Next actions
1. In GitHub repository Settings > Pages, unpublish the stuck site, re-enable `GitHub Actions` as the source, and save.
2. Rerun or trigger the native Pages workflow from `master`; confirm the run completes and the public URL reflects the latest build.
3. Add undo/recovery for removed rooms and items, plus review before re-import removes missing items.
4. Add a short issue preflight for blank project metadata and optional issuance notes.

## How to verify
```text
npm.cmd run lint
npm.cmd run build
Import General and Exterior into a clean project; confirm GEN-01, EXT-01, and 0 new.
Underline or bold the General/Exterior headings and confirm they remain section headings.
Select text across two or more item lines and apply Bold/Underline/Strike; confirm the outline still imports as separate items.
Re-import an older GN/000/RM-numbered outline and confirm existing items update rather than duplicate.
Open the final page and confirm the End of Punch List record is top-left with a full-width rule and indented entries.
Turn off Show issuances in Document Settings; confirm the ending title remains, dated lines disappear, and the screen-only Issuances workspace remains.
git -c safe.directory='G:/Files/Github/Punchlist' status --short --branch
```

## Recent logs
- docs/log/2026-08-06 1034 GitHub Pages stale deployment lock.md - confirmed the clean master workflow succeeds through artifact upload but GitHub's Pages deployment records remain stuck in progress.
- docs/log/2026-08-06 1017 Reset Pages source and remove temporary hooks.md - reset Pages metadata to workflow/master and removed the one-time remediation hooks.
- docs/log/2026-08-06 1013 Repair GitHub Pages metadata.md - added a one-time authenticated Pages metadata reset to workflow mode with master as the saved source branch.
- docs/log/2026-08-06 1011 Fix Pages diagnostic condition.md - corrected the temporary diagnostic's GitHub Actions expression after the first diagnostic commit was rejected before job creation.
- docs/log/2026-08-06 1010 Inspect GitHub Pages source.md - added a one-time authenticated source inspection after the cleaned deployment still timed out.
- docs/log/2026-08-06 0957 Fix Pages cleanup request.md - replaced the unavailable Octokit Pages-cancel helper with a raw authenticated API request.
- docs/log/2026-08-06 0955 Clear stale GitHub Pages deployment.md - added a one-time Pages API cleanup for the stale deployment that kept native master runs queued.
- docs/log/2026-08-06 0942 Restore master GitHub Pages deployment.md - restored native GitHub Actions Pages publishing from master after the main/gh-pages mismatch.
- docs/log/2026-08-06 0907 Publish main to GitHub Pages.md - moved the release branch to main and configured the verified production build for GitHub Pages.
- docs/log/2026-08-06 0836 Optional issuance history and ending flow.md - added the Show issuances setting and made the document ending occupy the next available row.
- docs/log/2026-08-06 0052 Parser semantics and document ending.md - added GEN/EXT aliases, baseline new-item logic, safe multi-line formatting, formatted-heading parsing, and the left-aligned multi-column issuance ending.
- docs/log/2026-08-06 0017 Issuance document ending and importer fixes.md - fixed four-card pagination, document-end issuance history, editable labels, importer formatting edge cases, and panel alignment.
- docs/log/2026-08-05 2332 Immutable issues and rich notes.md - implemented lock/correct/reissue history, true WYSIWYG outline formatting, and snapshot-aware backups.
- docs/log/2026-08-05 2242 Issuance flow and formatting.md - expanded the example, exposed formatting shortcuts, and defined the recommended issuance model.
