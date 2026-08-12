# 2026-08-12 0041 Expand prepared-by field

## TL;DR
- What changed: The Prepared by input now starts at 2.15 inches and grows with its content up to 2.75 inches.
- Why: Longer firm names were clipped in the document header.
- What didn't work: Nothing.
- Next: Continue visual review of the pagination branch.

---

## Full notes

The input uses its text length to request a wider native input size. CSS keeps a useful minimum width and caps growth before the right-side field can collide with the centered punch-list title. The field remains single-line and right-aligned in screen and print layouts.

Verification completed with all 10 Node tests, a successful Vite production build, and a browser measurement of the marked field at 254 px for `John B. Murray Architect, LLC`.
