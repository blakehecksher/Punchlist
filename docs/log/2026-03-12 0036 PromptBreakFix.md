# 2026-03-12 0036 PromptBreakFix

## TL;DR
- What changed: Restored the top of `src/PunchListApp.jsx` to a safe parseable state after a stray prompt fragment was left in module scope.
- Why: Raw text sitting at the top level of a JS module is treated as code and can break the app immediately.
- What didn't work: The leftover fragment contained older encoding artifacts, so the cleanup was done conservatively around the broken block.
- Next: If needed later, do a broader source-text cleanup pass to normalize old mojibake comments.

---

## Full notes

- `src/PunchListApp.jsx` now has the constants restored in live code and the stale prompt fragment neutralized so it cannot break parsing.
- Verification:
  - `npm run build` passed
