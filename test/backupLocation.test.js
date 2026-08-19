import test from "node:test";
import assert from "node:assert/strict";

import { findAvailableName, isFolderChoiceSupported } from "../src/backupLocation.js";

const takenNames = (...names) => {
  const set = new Set(names);
  return async (name) => set.has(name);
};

test("uses the plain name when nothing is in the way", async () => {
  const name = await findAvailableName("Site_punchlist 260819.json", takenNames());
  assert.equal(name, "Site_punchlist 260819.json");
});

test("suffixes rather than overwriting an existing backup", async () => {
  // Overwriting risks replacing a good backup with a worse one, so a repeat
  // backup on the same day gets its own file, as a repeat download would.
  const name = await findAvailableName(
    "Site_punchlist 260819.json",
    takenNames("Site_punchlist 260819.json"),
  );
  assert.equal(name, "Site_punchlist 260819 (1).json");
});

test("keeps counting past the first suffix", async () => {
  const name = await findAvailableName(
    "Site_punchlist 260819.json",
    takenNames(
      "Site_punchlist 260819.json",
      "Site_punchlist 260819 (1).json",
      "Site_punchlist 260819 (2).json",
    ),
  );
  assert.equal(name, "Site_punchlist 260819 (3).json");
});

test("still produces a name when every suffix is taken", async () => {
  // Never return a name that would overwrite: writing an oddly named backup
  // beats clobbering one that already exists.
  const name = await findAvailableName("b.json", async () => true, 3);
  assert.match(name, /^b \(\d+\)\.json$/);
  assert.notEqual(name, "b.json");
});

test("handles a name with no extension", async () => {
  const name = await findAvailableName("backup", takenNames("backup"));
  assert.equal(name, "backup (1)");
});

test("reports folder choice as unsupported without the browser API", () => {
  // Node has no window; the app falls back to the download folder and hides
  // the control rather than offering something that cannot work.
  assert.equal(isFolderChoiceSupported(), false);
});

// A stand-in for a FileSystemDirectoryHandle. Real handles cannot be built
// outside a browser, so the write logic is exercised against this instead.
function fakeDirectory({ failOn } = {}) {
  const files = {};
  return {
    files,
    async getFileHandle(name, options) {
      if (!options?.create && !(name in files)) throw new Error("NotFoundError");
      if (failOn === "getFileHandle") throw new Error("boom");
      return {
        name,
        async createWritable() {
          if (failOn === "createWritable") throw new Error("boom");
          return {
            async write(contents) {
              if (failOn === "write") throw new Error("boom");
              files[name] = contents;
            },
            async close() {},
          };
        },
      };
    },
  };
}

test("writes a backup into the chosen directory", async () => {
  const { writeIntoDirectory } = await import("../src/backupLocation.js");
  const dir = fakeDirectory();

  const name = await writeIntoDirectory(dir, "Site_punchlist 260819.json", "{}");

  assert.equal(name, "Site_punchlist 260819.json");
  assert.equal(dir.files["Site_punchlist 260819.json"], "{}");
});

test("a second backup the same day does not overwrite the first", async () => {
  const { writeIntoDirectory } = await import("../src/backupLocation.js");
  const dir = fakeDirectory();

  await writeIntoDirectory(dir, "Site_punchlist 260819.json", "first");
  const second = await writeIntoDirectory(dir, "Site_punchlist 260819.json", "second");

  assert.equal(second, "Site_punchlist 260819 (1).json");
  assert.equal(dir.files["Site_punchlist 260819.json"], "first");
  assert.equal(dir.files["Site_punchlist 260819 (1).json"], "second");
});

test("reports failure so the caller falls back to the download folder", async () => {
  const { writeIntoDirectory } = await import("../src/backupLocation.js");

  // A backup written somewhere unexpected is recoverable; one never written
  // is not, so every failure here has to be reported rather than thrown.
  for (const failOn of ["getFileHandle", "createWritable", "write"]) {
    assert.equal(await writeIntoDirectory(fakeDirectory({ failOn }), "b.json", "{}"), null);
  }
  assert.equal(await writeIntoDirectory(null, "b.json", "{}"), null);
  assert.equal(await writeIntoDirectory({}, "b.json", "{}"), null);
});
