# 2026-08-13 0048 Outline as living list

## TL;DR
- What changed: Clarified a product direction for discussion; no application code changed.
- Why: Initial Word/notes import is clear, but the app lacks an equally clear way to maintain later punch lists without re-importing.
- What didn't work: Treating later work as another import or as a formal issuance/correction branch makes the living list fuzzy.
- Next: Explore one structured item model with two synchronized working views: an outline for fast authoring and a grid for photos, followed by print output.

---

## Full notes

- The core value remains: paste a drafted outline, receive a clean numbered list, add photos, and print it.
- Import should bootstrap the project once. After that, the author should edit the same structured list in the app.
- The proposed outline is not a separate text document that gets reparsed. It is another editor over the same room and item records that power the photo grid.
- Item identity, photo attachment, display sequence, and visual ordering must remain separate concepts so outline edits cannot detach photos or accidentally reuse item numbers.
- Initial items receive per-room sequence numbers in outline order. Later items receive the room's next unused number; removed or completed numbers are not reused.
- Issuing can remain an output/checkpoint event without requiring a new working branch, lock, or correction workflow.
