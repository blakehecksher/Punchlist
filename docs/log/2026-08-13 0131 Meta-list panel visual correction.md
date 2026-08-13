# 2026-08-13 0131 Meta-list panel visual correction

## TL;DR
- What changed: Reframed and regenerated the visual exploration around the existing right-side Import Notes panel. No application code changed.
- Why: The first visual set incorrectly replaced the central document workspace; the intended direction is to preserve it and promote the panel into the persistent controlling outline.
- What didn't work: Full-width List workspaces, separate item inspectors, and outline rails changed the product's strongest existing interface.
- Next: Select or refine one of the three right-panel approaches before implementation.

---

## Full notes

- Captured the current app with its Import Notes panel open as the exact visual source.
- The central paginated punch-list and photo interface is now a hard invariant.
- The revised directions change only the panel and its toolbar trigger.
- Direction one is a structured outliner with collapsible rooms, stable codes, photo counts, and a live blank item.
- Direction two is a clean continuous word-processor-like outline with an editing toolbar and synced item metadata.
- Direction three is the smallest evolution of the existing textarea: a persistent, autosaved, syntax-aware outline.
- In every direction, the panel is the living source of rooms, ordering, and descriptions; the middle document mirrors it while retaining all existing photo and print behavior.
- Current-layout reference: `docs/design/2026-08-13-current-import-panel.png`.
