# 2026-03-12 0031 PromptCleanup

## TL;DR
- What changed: Removed the legacy prompt text from the active code path in `src/PunchListApp.jsx` so only the current import prompt remains live.
- Why: The old prompt block was leftover cleanup debt from a prior patch and no longer reflected the intended importer instructions.
- What didn't work: The stale block had older encoding artifacts, so the cleanup was done conservatively to avoid touching unrelated prompt logic.
- Next: If we do a broader text-normalization pass later, clean up any remaining mojibake comments/section markers in the file headers.

---

## Full notes

- `src/PunchListApp.jsx` now keeps the current `IMPORT_CLEANUP_PROMPT` as the only active prompt used by the copy-to-clipboard flow.
- Verification:
  - `npm run build` passed
