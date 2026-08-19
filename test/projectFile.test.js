import test from "node:test";
import assert from "node:assert/strict";

import { makeBackupFilename } from "../src/projectFile.js";

const june = new Date(2026, 5, 9);

test("names backups so they sort by date in the download folder", () => {
  assert.equal(
    makeBackupFilename({ project: "530 Harris Road" }, june),
    "530 Harris Road_punchlist 260609.json",
  );
});

test("falls back to a usable name for an untitled project", () => {
  assert.equal(
    makeBackupFilename({ project: "" }, june),
    "Punchlist_punchlist 260609.json",
  );
  assert.equal(makeBackupFilename({}, june), "Punchlist_punchlist 260609.json");
  assert.equal(makeBackupFilename(null, june), "Punchlist_punchlist 260609.json");
});

test("strips characters a file system would reject", () => {
  assert.equal(
    makeBackupFilename({ project: "A/B: 3rd & 4th <floor>" }, june),
    "AB 3rd  4th floor_punchlist 260609.json",
  );
});

test("pads short date parts so names stay a fixed width", () => {
  assert.equal(
    makeBackupFilename({ project: "Site" }, new Date(2027, 0, 5)),
    "Site_punchlist 270105.json",
  );
});

test("stamps the document's schema version into the payload builder", async () => {
  // A backup file outlives the release that wrote it, so it has to say which
  // document shape it holds rather than leaving a future reader to guess.
  const { buildBackupPayload } = await import("../src/projectFile.js");
  const { SCHEMA_VERSION } = await import("../src/projectStore.js");

  const payload = buildBackupPayload({ project: "Site", rooms: [] }, { a: 1 });

  assert.equal(payload.data.schemaVersion, SCHEMA_VERSION);
  assert.equal(payload._punchlistFile, true);
  assert.deepEqual(payload.photos, { a: 1 });
});
