import test from "node:test";
import assert from "node:assert/strict";

import {
  collectItemIds,
  findOrphanPhotoIds,
  selectRecoverableOrphans,
} from "../src/photoGc.js";

const documentWith = (roomItemIds = [], generalItemIds = []) => ({
  generalNotes: generalItemIds.map((id) => ({ id })),
  rooms: [{ id: "room-1", items: roomItemIds.map((id) => ({ id })) }],
});

test("collects item IDs from both general notes and rooms", () => {
  const ids = collectItemIds(documentWith(["a", "b"], ["g1"]));
  assert.deepEqual([...ids].sort(), ["a", "b", "g1"]);
});

test("finds photos whose item is gone", () => {
  const orphans = findOrphanPhotoIds(documentWith(["a"]), ["a", "removed"]);
  assert.deepEqual(orphans, ["removed"]);
});

test("refuses to report orphans when the document has no items", () => {
  // An empty document is indistinguishable from one that failed to load. If
  // that case reported orphans, a bad read would delete every photo.
  assert.deepEqual(findOrphanPhotoIds(documentWith([], []), ["a", "b"]), []);
  assert.deepEqual(findOrphanPhotoIds(null, ["a", "b"]), []);
  assert.deepEqual(findOrphanPhotoIds(undefined, ["a"]), []);
});

test("only clears orphans that the backup payload actually contains", () => {
  // The delete is recoverable exactly because the bytes are in the file that
  // was just written. A photo missing from the payload must survive.
  const recoverable = selectRecoverableOrphans(
    ["in-backup", "not-in-backup"],
    { "in-backup": { dataUrl: "data:image/jpeg;base64,AAA" } },
  );

  assert.deepEqual(recoverable, ["in-backup"]);
});

test("treats an empty backup payload as nothing safe to delete", () => {
  assert.deepEqual(selectRecoverableOrphans(["a", "b"], {}), []);
  assert.deepEqual(selectRecoverableOrphans(["a"], undefined), []);
});
