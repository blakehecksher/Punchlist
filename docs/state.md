# State
_Last updated: 2026-03-25_

## Current focus
Validate the richer `isNew` / revised / completed workflow in real browser use, especially Notion/Word clipboard behavior and the updated item-number styling in the app.

## What's working
- `npm run dev` serves the app locally
- Pushes to `master` build and deploy via `.github/workflows/deploy.yml`
- The punch list editor, photo handling, local persistence, density controls, summary pages, and project file flows are working
- New blank projects default the document title to `Punch List`
- The default header note renders in italics and explains underline, bold, and strikethrough states using the actual inline formatting shown in the document
- `Clear All` preserves the current project header fields (`Project Name`, `Project Number`, `Title`, `Date`, `Firm Name`) while resetting the punch list body
- The importer preserves issue codes for General Notes and room items, supports merge and append modes, and keeps matched item IDs so photos persist on merge re-import
- Imported items track explicit `isNew` metadata, and matched coded items clear `isNew` when re-imported without an underlined code
- Manually added general notes, room items, and the first item in a newly added room now also start with `isNew`, so their issue numbers underline immediately and the summary `new` count updates without an import round-trip
- The summary header shows counts for total, new, revised, and completed items
- When summary pages are turned off, the summary count chips still render above the first detail-page section instead of disappearing
- New item numbers now render underlined in the summary and detail/photo cards, and completed item numbers render with strikethrough where appropriate
- `Copy Notes` now writes underlined issue codes for new items and struck issue codes for completed items, using rich HTML clipboard output when available so Word/Notion can preserve that formatting on paste
- Revised/completed counts detect a broader set of bold/strikethrough markup emitted by the browser editor
- `npx.cmd eslint src` passes and `npm.cmd run build` passes

## In progress
- Manual browser validation of `Copy Notes` into Notion and Word, especially that underlined and struck issue codes survive paste consistently
- Manual browser validation that merge re-import clears `new` status when the external underline is removed
- Manual browser validation that live bold/strikethrough edits update the summary revised/completed counts as expected
- Manual browser validation that the inline count row looks right on the first detail page when summary pages are disabled
- Broader real-project print/PDF review of summary and detailed layouts
- Word import validation against real `.docx` exports

## Known issues
- `npm.cmd run lint` still fails on legacy `PunchList_925Park.jsx` issues outside the current `src/` app path
- Summary pages and dense detailed layouts still need broader real-project validation in the browser and print preview
- End-to-end browser validation of the new styled issue-code copy/import cycle is still pending with real project data

## Next actions
1. Copy notes into Notion and Word and confirm new item numbers paste underlined and completed item numbers paste struck through.
2. Edit an item in the app with bold and strikethrough formatting and confirm revised/completed counts update immediately.
3. Turn summary pages off and confirm the count chips still sit cleanly above the first detail-page section.

## How to verify
```bash
cd "c:/Users/blakeh/OneDrive - John B. Murray Architect/0001 Office/Program Playground/Punchlist"
npm.cmd run dev
# open http://localhost:5173
# add a new general note, a new room item, and a brand-new room
# confirm each new issue number renders underlined in the editor/summary/detail views
# confirm the summary new count increments immediately for those in-app additions
# edit an item description in the app with bold and strikethrough formatting and confirm revised/completed counts update immediately
# toggle summary pages off and confirm the count chips still render above the first detail-page section
# copy notes into Notion or Word and confirm new/completed issue-code styling survives paste
# remove underline from a previously new issue code externally, re-import in Merge mode, and confirm that item no longer counts as new
npx.cmd eslint src
npm.cmd run build
```

## Recent logs
- docs/log/2026-03-25 1741 InlineSummaryCount.md - kept the summary count chips visible on the first detail page when summary pages are disabled
- docs/log/2026-03-25 1735 InAppNewItems.md - made in-app added items start as new so counts and underlined issue numbers update immediately
- docs/log/2026-03-25 1655 IssueCodeFormattingFollowup.md - styled issue codes for completed/new items in export and in-app views and hardened revised/completed count detection
