# 2026-08-14 0926 Editable ending entries

## TL;DR
- What changed: Replaced the single ending field with addable, removable, editable lines and moved Add Room above the End of Punch List box.
- Why: The ending should behave like Site Conditions while remaining simple free text rather than a versioning workflow.
- What didn't work: The first live inspection helper did not expose an input-value method, so the rendered accessibility tree was used to verify the value instead.
- Next: Review the local preview with a representative project and confirm the PDF output.

---

## Full notes

- `+ Add issue date` creates `Punch List issued [document date]` from the current document header date.
- Each line remains ordinary editable text and has an X removal control.
- Older single-field values and legacy issuance dates normalize into the new line list.
- Add Room now sits between the final area's Add Item action and the ending box.
- Help copy now matches the add-and-save-PDF workflow.
- Live browser testing covered add, edit, autosave/reload, remove, and final-page ordering.
- Lint, all 15 tests, and the production build pass.
