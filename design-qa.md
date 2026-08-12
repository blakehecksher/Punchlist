# Design QA: Issued versions in the project sidebar

## Visual truth and implementation

- Source: `C:\Users\blake\AppData\Local\Temp\codex-clipboard-ba80349b-ec70-4c45-a69c-466ad028f1f4.png`
- Implementation: `C:\Users\blake\.codex\visualizations\2026\08\12\019ff415-52f7-7dd1-b0a3-af785c4226ff\issuance-audit\07-sidebar-final-1119x920.png`
- Selected-issuance edit state: `C:\Users\blake\.codex\visualizations\2026\08\12\019ff415-52f7-7dd1-b0a3-af785c4226ff\issuance-audit\09-edit-selected-issuance.png`
- Combined comparison input: `C:\Users\blake\.codex\visualizations\2026\08\12\019ff415-52f7-7dd1-b0a3-af785c4226ff\issuance-audit\08-sidebar-comparison.png`
- Viewport: 1119 x 920 CSS pixels at desktop density.
- State: active `925 Park Avenue, Apt 3-4A` project, sidebar expanded, three issued versions visible, correction working draft open near the document ending.

## Findings

- P0: none.
- P1: none.
- P2: none.
- The implemented project hierarchy occupies the three annotated sidebar slots and uses the product's existing typography, border, spacing, and grayscale palette.
- The latest issuance is visibly marked; issued dates remain secondary to titles.
- The source did not specify child-row copy, so the implementation adds a quiet `Issued versions` label and real snapshot titles/dates while preserving the intended indentation.
- The bottom Issuances workspace remains aligned with the document and is visually compact; detailed management is collapsed by default.
- Direct-edit mode clearly names the selected issuance in a fixed banner and repeats the Save/Cancel actions in the Issuances workspace.

## Required surface check

- Typography: existing sans-serif sidebar system and serif document title preserved.
- Spacing: project row, child indentation, vertical hierarchy rule, and workspace gutters are consistent with the source layout.
- Colors: existing black, white, and neutral gray tokens only.
- Assets and image quality: existing photo assets and interface icons are unchanged and render cleanly.
- Copy: `Preview / Print PDF`, `Record as issued`, `Edit this issued version`, and `Create correction from this version` state the consequence of each action directly.
- Focused-region comparison: not required; the sidebar and issuance controls are readable at the matched full viewport.

## Verification

- Core navigation, older-snapshot selection, direct-edit mode, cancel-without-saving, return-to-current, Reprint, and compact history disclosure were exercised in the in-app browser.
- Fresh reload produced no new console errors or warnings.
- `npm test`, `npm.cmd run lint`, `npm.cmd run build`, and `git diff --check` passed.

final result: passed
