import test from "node:test";
import assert from "node:assert/strict";

import {
  getLegacyEndDates,
  makeDocumentEndEntry,
  normalizeDocumentEndEntries,
} from "../src/endOfPunchList.js";

test("converts legacy issuance history into a simple list of dates", () => {
  assert.equal(
    getLegacyEndDates({
      history: [
        { issuedAt: "2026-08-01T14:00:00.000Z" },
        { issuedAt: "2026-08-01T20:00:00.000Z" },
        { issuedAt: "2026-08-14T14:00:00.000Z" },
        { issuedAt: "not-a-date" },
      ],
    }),
    "August 1, 2026, August 14, 2026",
  );
});

test("returns a blank value when there is no legacy history", () => {
  assert.equal(getLegacyEndDates(), "");
});

test("prefills a new editable entry from the document date", () => {
  assert.equal(
    makeDocumentEndEntry("August 14, 2026"),
    "Punch List issued August 14, 2026",
  );
  assert.equal(makeDocumentEndEntry(), "Punch List issued");
});

test("preserves current entries and converts the previous single text field", () => {
  assert.deepEqual(
    normalizeDocumentEndEntries({
      endOfPunchListEntries: ["Punch List issued August 14, 2026", "Custom note"],
    }),
    ["Punch List issued August 14, 2026", "Custom note"],
  );
  assert.deepEqual(
    normalizeDocumentEndEntries({ endOfPunchListDates: "August 1, 2026" }),
    ["August 1, 2026"],
  );
});

test("treats a missing record like an empty one", () => {
  // A corrupt or absent project reads back as null, not undefined, so the
  // default parameter did not cover it and this threw.
  assert.deepEqual(normalizeDocumentEndEntries(null), []);
  assert.deepEqual(normalizeDocumentEndEntries(undefined), []);
  assert.deepEqual(normalizeDocumentEndEntries({}), []);
});
