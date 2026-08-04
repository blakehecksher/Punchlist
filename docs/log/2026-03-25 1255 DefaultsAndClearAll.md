# 2026-03-25 1255 DefaultsAndClearAll

## TL;DR
- What changed: the default document title is now `Punch List`, the default header note now includes underlined/bold/strikethrough guidance in actual rich-text formatting, and `Clear All` now preserves the current header fields.
- Why: the previous defaults were off from the desired issued-document language, and clearing the punch list should not wipe project-level header metadata.
- What didn't work: browser-level manual validation of the updated `Clear All` flow and header note rendering was not run from the terminal session.
- Next: confirm in the browser that `Clear All` keeps the edited header values, resets the punch list body, and restores the new default header note.

---

## Full notes

- Added a shared `DEFAULT_HEADER_NOTE` HTML string in `src/PunchListApp.jsx` so the app uses one canonical default for new projects and resets.
- Changed the default title in `makeBlankProjectData()` from `Punchlist` to `Punch List`.
- Removed the old `INITIAL_DATA.headerNote` override so the example project also uses the same default rich-text header note.
- Updated the `clearAll` reducer case so it resets the punch list data but preserves:
  - `project`
  - `projectNum`
  - `title`
  - `date`
  - `firm`
- Verified locally with:
  - `npx.cmd eslint src`
  - `npm.cmd run build`
