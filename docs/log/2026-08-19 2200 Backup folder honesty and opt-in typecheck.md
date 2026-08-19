# 2026-08-19 2200 Backup folder honesty and opt-in typecheck

## TL;DR
- What changed: the backup folder control now reports where backups will
  actually land rather than just naming the folder; TypeScript checks the data
  layer in JSDoc mode via `npm run typecheck`, gated in CI.
- Why: a reported problem with the folder picker turned out to be two separate
  things — one browser behaviour that needed guidance, and one real bug where
  the sidebar claimed a destination it was not writing to.
- What didn't work: `checkJs` across the whole project produced 679 errors,
  nearly all implicit-any on component parameters. Opt-in per file instead.
- Next: the Playwright smoke suite is the largest remaining gap. The outline
  pane is a separate conversation.

---

## Full notes

### The two dialogs were not the same problem

**"Can't open this folder because it contains system files."** That is the
browser refusing a directory on its blocklist, not an app failure. Nothing in
the app could have prevented it after the fact, but it could have been avoided:
the control now carries a line of guidance in its default state — pick a normal
folder such as Documents, browsers block folders holding system files — and the
Choose button repeats it in a tooltip.

**"Allow this site to edit files in 0000 General?"** That one is not an error at
all. It is the expected permission prompt after picking a valid folder, and
answering Allow is what completes the setup.

### The real bug was underneath both of them

`getBackupFolderName` returned the stored handle's name without checking
whether it could still be written to, while `getWritableBackupFolder` required
permission to be `granted`. Those two disagreeing is the whole bug: browsers
drop write permission between sessions, so the sidebar could read
"0000 General" while every backup went to the download folder.

That is the worst shape a failure can take here. The user believes their
backups are somewhere specific; they are not, and nothing says so.

`getBackupFolderStatus` now returns `{ name, permission }` and the UI reads
both. A folder that cannot be written to shows the true destination, names
itself in a warning, and offers a one-click Reconnect that re-requests
permission from a user gesture.

Choosing a folder also reports its outcome now instead of returning a bare
name or null:

- `chosen` — stored and writable
- `cancelled` — dismissed deliberately, so nothing is said
- `denied` — a folder was picked but permission refused, which has to be said
  out loud or the user believes they set up something they did not
- `unsupported` — no picker in this browser

Cancel and the system-folder refusal both surface as an abort and cannot be
told apart, which is why the guidance is up front rather than after the fact.

### TypeScript, measured before deciding

Full `checkJs` with `strict` over the project: 679 errors, 166 of them in
`PunchListApp.jsx` alone, almost entirely implicit-any on component parameters.
That is noise, and a repo-wide flip would have meant either suppressing it or
annotating 2,100 lines of JSX for no benefit.

So checking is opt-in: `"checkJs": false` means only files starting with
`// @ts-check` are checked. Eleven data-layer modules opt in — the ones that
read, write and migrate a saved punch list. Components do not.

Shared shapes live in `src/types.d.ts`, referenced from JSDoc as
`import("./types.js").ProjectData`. `Item` deliberately has no state field:
new, revised and complete are read from the description's markup, and a field
there would invite a second source of truth back in. `StoredItem` exists
separately to describe what may actually be in storage, including the removed
`isNew` that `normalizeStoredData` strips on load.

`src/browser.d.ts` declares the three File System Access members TypeScript's
DOM library lacks — `showDirectoryPicker`, `queryPermission`,
`requestPermission`. That list was verified against the compiler rather than
recalled: `createWritable`, `document.execCommand`, `navigator.storage.persist`
and `.estimate` all already resolve. Three members is one small file, not a
reason to add an `@types` package.

Files stay `.js`. No renames, no syntax change, no build change — Vite is not
even aware of the tsconfig.

### What the types found on the way in

Two things, both small, both real:

1. `formatLegacyIssueCodes` passed a possibly-undefined title straight into
   `ROOM_NUMBER_RE.test(title)`, where it would have been coerced to the string
   `"undefined"`. Now guarded.
2. `normalizeStoredData` destructures a legacy `isNew` off items. Typing the
   input as `Item` made that an error, which is the type system correctly
   pointing out that the load path accepts a looser shape than the rest of the
   app. That shape is now named `StoredItem`, and the cast back to
   `ProjectData` at the end of the function is commented as the trust boundary
   it is.

Neither would have shipped a bug on its own. Both are the kind of thing that
becomes one later.

### Verified in Chromium

A stored folder handle that cannot report permission — what a lapsed one looks
like — produces "Downloads (default)" as the destination, a warning naming the
folder, and Reconnect. Use Downloads clears it and restores the hint. The
previous rounds' behaviour all still holds: the real-project photo chain,
backup-to-Downloads fallback, delete confirmation backup age, and the storage
failure banner.

### Test count

69 → 72, plus the typecheck gate.
