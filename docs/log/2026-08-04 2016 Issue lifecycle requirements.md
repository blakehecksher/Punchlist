# 2026-08-04 2016 Issue lifecycle requirements

## TL;DR
- What changed: Added product requirements for item assignment, contractor response, reviewed closeout, non-repair dispositions, and retained project history.
- Why: Easy photo attachment addresses evidence capture but not the full accountability and closeout workflow of an architectural punch list.
- What didn't work: No implementation was attempted; the existing app still uses strikethrough text for completion and destructive item removal.
- Next: Define states, permissions, response fields, and the active-versus-history user experience before changing the data model.

---

## Full notes

The essential record is larger than a printable row. A project representative finds and documents the condition, assigns responsibility, receives a response, and decides whether the item is fixed, accepted as-is, unfixable, duplicative, not applicable, or otherwise ready to leave the active list.

An item that leaves the active list must remain in a durable project log. Its issue number, original description and photos, responsible party, responses, status changes, reviewer, closeout date, and reason should remain available. This supports accountability and explains why an item no longer appears as open, even when the outcome was not a physical repair.

Fast input while walking the job remains an important possible workflow, but it is distinct from the current import-first flow and has not yet been designed.
