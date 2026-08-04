# 2026-03-12 0129 RemoveClipboardButton

## TL;DR
- What changed: Removed the `Paste From Clipboard` button and its direct clipboard-read handler from the import drawer.
- Why: `.docx` import is working and is the intended office workflow; the extra clipboard button added complexity without producing a reliable result.
- What didn't work: Direct Word paste still was not preserving hierarchy well enough to justify keeping the button in the UI.
- Next: Keep testing the `.docx` import path with real office files.

---

## Full notes

- Removed `handlePasteFromClipboard` from `src/PunchListApp.jsx`.
- Removed the `Paste From Clipboard` button from the import actions row.
- Left the working `.docx` upload path intact.
- Reframed `docs/state.md` around file-import-first workflow instead of continued clipboard experimentation.
