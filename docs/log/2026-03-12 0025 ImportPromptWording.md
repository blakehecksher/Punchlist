# 2026-03-12 0025 ImportPromptWording

## TL;DR
- What changed: Rewrote the chatbot cleanup prompt to be more explicit about the required output structure and updated the helper copy to tell users exactly how to use it.
- Why: The old wording left too much room for interpretation, especially for users unfamiliar with prompt-based cleanup workflows.
- What didn't work: No new blocker in the active app path.
- Next: Spot-check the prompt with a few real chatbot runs to confirm it consistently returns importable bullet lists.

---

## Full notes

- `src/PunchListApp.jsx` now uses a more explicit cleanup prompt that:
  - defines the output rules
  - shows the exact bullet structure expected by the importer
  - tells the chatbot to reply with the cleaned bullet list only
- The import tip text now explains the workflow directly:
  - copy the prompt
  - paste it into a chatbot
  - paste raw notes after it
  - bring the cleaned result back into the import box
- Verification:
  - `npm run build` passed
