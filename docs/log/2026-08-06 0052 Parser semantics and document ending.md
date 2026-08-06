# 2026-08-06 0052 Parser semantics and document ending

## TL;DR
- What changed: Moved the printed issuance ending to the top-left, added two-column history capacity, changed General/Exterior codes to GEN/EXT, corrected first-issuance new markers, and made multi-item rich formatting structurally safe.
- Why: Issued PDFs need a compact document record, while imports must remain predictable even when users format headings, bullets, or several items at once.
- What didn't work: Browser automation could not reproduce a native drag selection across several content-editable lines, so the restriction removal and balanced-line serialization were verified through code, parser fixtures, and the live editor's resulting canonical structure.
- Next: Publish the verified release pass to GitHub.

---

## Full notes

- The End of Punch List rule now spans the full inner width. The heading sits at the top-left and issuance lines are indented below it.
- Issuance history is chunked into ten-entry columns, giving the reserved row capacity for twenty common issuance records.
- General item codes now read GEN-NN. Exterior sections without a numeric room identifier use EXT-NN and no longer show an Add room no. warning.
- Re-import indexing still accepts prior GN, 000, and RM codes.
- First imports are baseline content with no automatic new underline. Starting a correction or new issuance clears the prior cycle's new flags.
- The outline formatter permits selections across line breaks. Serialization closes and reopens inline tags per line so one formatted selection cannot swallow several bullets into malformed markup.
- Parser normalization moves whole-line formatting inside the bullet marker and strips formatting from section names, preserving General/Exterior classification.
- A clean browser test imported General and Exterior as GEN-01 and EXT-01 with zero new items.
- Screenshot comparison evidence is recorded in `design-qa.md`; the final result passed.
