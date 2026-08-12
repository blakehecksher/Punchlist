import test from "node:test";
import assert from "node:assert/strict";

import {
  replaceIssuanceRecord,
  startCorrectionForIssuance,
} from "../src/issuanceLifecycle.js";

const history = [
  {
    id: "issue-1",
    issueNumber: 1,
    revision: 0,
    title: "Punch List",
  },
  {
    id: "issue-2",
    issueNumber: 1,
    revision: 1,
    title: "Correction 1",
    supersedesId: "issue-1",
  },
  {
    id: "issue-3",
    issueNumber: 2,
    revision: 0,
    title: "Punch List 2",
  },
];

test("starts a correction from a selected historical issuance", () => {
  const result = startCorrectionForIssuance(
    { locked: true, history },
    "issue-1",
    "Correction 2",
  );

  assert.equal(result.target, history[0]);
  assert.equal(result.issuance.locked, false);
  assert.equal(result.issuance.draftMode, "correction");
  assert.equal(result.issuance.correctionTargetId, "issue-1");
  assert.equal(result.issuance.draftTitle, "Correction 2");
  assert.deepEqual(result.issuance.history, history);
});

test("replaces only the selected issuance record", () => {
  const result = replaceIssuanceRecord(
    { locked: true, history },
    "issue-1",
    { title: "Updated Punch List", itemCount: 14 },
  );

  assert.equal(result.record.id, "issue-1");
  assert.equal(result.record.title, "Updated Punch List");
  assert.equal(result.record.itemCount, 14);
  assert.equal(result.issuance.history[1], history[1]);
  assert.equal(result.issuance.history[2], history[2]);
});
