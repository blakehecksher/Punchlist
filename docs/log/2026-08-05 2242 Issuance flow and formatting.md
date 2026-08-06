# 2026-08-05 2242 Issuance flow and formatting

## TL;DR
- What changed: Expanded the practice document, added visible formatting controls and shortcuts to note import, revised first-run copy, documented the current re-issue workaround, and defined a narrow recommended Issue-history model.
- Why: Make the first project feel realistic, make the document conventions usable without hidden knowledge, and clarify how a printed punch list evolves without turning the product into a contractor workflow suite.
- What didn't work: The in-app screenshot backend timed out on the expanded four-page example; its content and counts were verified through the live DOM, while the surrounding flow was captured successfully.
- Next: Decide whether to implement immutable Issue snapshots and stable issued item codes.

---

## Full notes

- Applied the browser annotation exactly: the blank-state primer now names Word, Docs, Notes, and any text editor.
- Kept Project address, Project number, and Prepared by blank with their existing placeholders on new personal lists.
- Expanded the practice project to three Site Conditions, three General Notes, and six rooms with representative punch items.
- Added a versioned example fixture so existing saved previews receive the richer sample when opened.
- Added Bold, Underline, and Strikethrough buttons beside the import outline with Ctrl+B, Ctrl+U, and Ctrl+Shift+X labels and keyboard handling.
- Added selected-text recovery feedback, formatting semantics in the primer, and underline-driven new-item counting.
- Added a current re-issue explanation to How it works: duplicate before editing, update the copy, preserve the original.
- Ran a second-agent product-flow review. The recommended long-term pattern is one living project with immutable Issue 01/02 snapshots, stable issued codes, compact issue history, and no contractor assignment suite.
- Saved the evidence-backed review in `docs/audits/2026-08-05-issuance-flow/README.md` and narrowed `docs/spec.md` accordingly.
- Lint and production build pass; structured formatting markers parse into bold, underline, and strikethrough output.
