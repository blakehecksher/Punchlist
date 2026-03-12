# 2026-03-11 2358 ImportPromptCopy

## TL;DR
- What changed: Reworked the import drawer copy to match the desired wording and added a clickable `Copy prompt` action that copies a cleanup prompt to the clipboard.
- Why: The import panel should teach the preferred outline format clearly and give users an easy way to prep rough field notes with a chatbot.
- What didn't work: No new blocker in the active app path; clipboard copy still depends on browser clipboard permissions.
- Next: Spot-check the copy button and prompt text on the live site to confirm the interaction feels obvious.

---

## Full notes

- `src/PunchListApp.jsx` now:
  - uses the revised import help copy
  - shows the simplified `Study 410` outline example
  - includes the full cleanup prompt text block
  - adds a `Copy prompt` button wired to `navigator.clipboard.writeText(...)`
  - shows brief `Copied` / `Copy failed` feedback inline on the button
- `src/styles.css` now styles the tip row, prompt block, and copy button so the button reads as a real interactive control.
- Verification:
  - `npm run build` passed
