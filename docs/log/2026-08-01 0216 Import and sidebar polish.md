# 2026-08-01 0216 Import and sidebar polish

## TL;DR
- What changed: Removed the import mode selector and append behavior, clarified note-file loading, removed the formatting-prompt panel, and reserved sidebar scrollbar space.
- Why: Keep the import workflow focused on the normal edit-and-merge workflow and prevent list growth from shifting sidebar controls.
- What didn't work: Nothing blocking.
- Next: Continue browser validation of importing, photo attachment, and print output.

---

## Full notes

- Import now always dispatches the existing merge behavior.
- The import panel explains the supported note formats: Word `.docx`, Markdown, and plain text.
- The import file action is labeled `Load notes file` to distinguish it from the sidebar's complete project-file loader.
- The Quick Start copy no longer references the removed AI formatting prompt.
- Removed unused append/prompt state, reducer code, helper code, and styling.
- Added `scrollbar-gutter: stable` to the sidebar and punch-list list containers.
- `npm.cmd run lint` and `npm.cmd run build` both pass.
