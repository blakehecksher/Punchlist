# Punch List UX review

_Reviewed: 2026-08-01_

## Scope

The primary workflow for an architect or contractor creating a room-by-room
punch list, writing items, attaching photos, and preparing a printable PDF.
The target is a deliberately simple field tool, not a document-management
suite.

## Overall verdict

The document editor and numbering model were strong, but the workspace treated
secondary controls as if they were part of the main job. A first-time user saw
project switching, view density, summary settings, sorting, duplication,
clipboard export, backup files, clearing, project metadata, status counts,
formatting guidance, importing, and printing at once. The revision keeps those
capabilities but makes the primary path `Add room → write item → add photo`.

## Flow steps

1. **Open the workspace — needs attention in the original.** The printable page
   was legible, but the open sidebar and toolbar competed with it. The sidebar
   also shifted the fixed-width document far enough to create horizontal
   scrolling on a normal laptop viewport. See [01-workspace.png](01-workspace.png).
2. **Read the quick-start guidance — needs attention in the original.** Five
   steps, a template callout, and explanatory footer repeated information that
   was also present in the empty state and import panel. See
   [02-quick-start.png](02-quick-start.png).
3. **Import existing notes — needs attention in the original.** Formatting rules
   appeared before the paste field, making a useful shortcut feel like a setup
   task. Help and import could also be open at the same time. See
   [03-import.png](03-import.png).
4. **Add a room and item — mixed in the original.** Automatic issue numbering and
   the missing-room-number warning were helpful. The action could leave the user
   far from the newly created room, and the empty photo target was a clickable
   `div` with no keyboard affordance. See [04-new-room.png](04-new-room.png).
5. **Use the revised workspace — healthy.** Room creation is now a primary action,
   help is reduced to three steps, import starts with the input, new lists start
   blank, and secondary controls are collapsed. See
   [08-revised-import.png](08-revised-import.png) and
   [10-final-core-flow.png](10-final-core-flow.png).
6. **Create the first room — healthy.** The app scrolls to the new card, focuses
   and selects the room name, assigns `000-01`, and exposes the photo target as a
   keyboard-focusable button. See
   [10-final-core-flow.png](10-final-core-flow.png).

## Highest-impact changes made

- Promoted **Add room** and made the first-use choice only **Add first room** or
  **Import notes instead**.
- Removed the five-page example document from newly created punch lists.
- Collapsed document settings, backups, and maintenance actions in the sidebar.
- Reduced help to the three-step product loop and made help/import mutually
  exclusive.
- Moved import formatting instructions behind an optional disclosure.
- Changed the on-screen photo affordance to **Add photo**, added an accessible
  name and keyboard activation, and retained **No Photo Provided** for print.
- Closed the project panel after creating, duplicating, or switching lists and
  stopped it from pushing the document sideways on common laptop widths.

## Accessibility evidence and limits

Visible focus, accessible names, target semantics, toolbar reflow, and horizontal
overflow were checked in the local browser. The photo target is now reachable by
keyboard and item removal controls include the issue number. This is not a full
WCAG audit: screen-reader announcements, full keyboard traversal, color contrast
ratios, zoom beyond the tested narrow viewport, and the operating-system print
dialog still require dedicated testing.
