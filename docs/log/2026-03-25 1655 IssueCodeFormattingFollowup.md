# 2026-03-25 1655 IssueCodeFormattingFollowup

## TL;DR
- What changed: completed items now strike through the exported issue code, new/completed issue codes now style correctly in the in-app summary and detail cards, and revised/completed counts detect live browser-emitted formatting more reliably.
- Why: Notion export needed the issue number to visually match completed items, new item numbers needed to read as underlined in the app itself, and summary counts needed to respond to live bold/strikethrough edits.
- What didn't work: browser-level Notion and Word paste validation was not rerun from the terminal session.
- Next: verify the full copy/paste/import loop in the browser with real project notes.

---

## Full notes

- Updated `src/exportNotes.js` so issue-code formatting now reflects both states:
  - new item codes export underlined
  - completed item codes export struck through
  - codes that are both new and completed export with both wrappers
- Updated `src/importParser.js` so those wrapped issue-code formats still parse back correctly on import, including `~~CODE~~` and `~~__CODE__~~`.
- Updated `src/PunchListApp.jsx` and `src/ItemCard.jsx` so issue numbers in the summary and detail/photo cards now visually reflect `isNew` and completed state.
- Expanded inline-format detection for revised/completed counts so browser-emitted tags like `<strong>`, `<del>`, and `<strike>` still count correctly.
- Verified locally with:
  - `npx.cmd eslint src`
  - `npm.cmd run build`
  - a Node smoke test covering export/import of underlined and struck issue-code prefixes
